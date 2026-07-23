import type { PlaceResult, Coordinates } from "@/lib/places/types";
import type { PlaceSuggestionKind, ResolvedSearchPlace } from "@/lib/places/autocomplete";
import { classifyPlaceTypes } from "@/lib/places/autocomplete";
import { cuisineFromGoogleTypes, priceLevelFromGoogle, cityFromAddress } from "@/lib/places/cuisine-map";
import { DISCOVER_RESULT_LIMIT } from "@/lib/discover-results";
import { MAX_DISCOVER_RADIUS_METERS } from "@/lib/places/nearby-search";
import type { Cuisine, Restaurant } from "@/lib/types";

/** Default radius when jumping to a city/neighborhood via search. */
export const CITY_SEARCH_RADIUS_METERS = 8047; // ~5 mi

export type DiscoverCameraTarget = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  /** Bumps force re-animation even when coords are unchanged. */
  token: number;
};

const RESTAURANT_DELTA = 0.014;
const ADDRESS_DELTA = 0.03;
const NEIGHBORHOOD_DELTA = 0.06;
const CITY_DELTA = 0.22;

/** Insert selected restaurant at front, dedupe by place id, cap at Discover limit. */
export function insertSelectedRestaurant(
  places: PlaceResult[],
  selected: PlaceResult,
  limit = DISCOVER_RESULT_LIMIT,
): PlaceResult[] {
  const rest = places.filter((p) => p.googlePlaceId !== selected.googlePlaceId);
  return [selected, ...rest].slice(0, limit);
}

export function resolvedPlaceToPlaceResult(resolved: ResolvedSearchPlace): PlaceResult {
  const address = resolved.address ?? "";
  const hasPrice = resolved.priceLevel != null && resolved.priceLevel !== "";
  return {
    googlePlaceId: resolved.placeId,
    name: resolved.name,
    address,
    city: resolved.city || cityFromAddress(address),
    cuisine: cuisineFromGoogleTypes(resolved.cuisineTypes, resolved.primaryType ?? undefined) as Cuisine,
    priceLevel: priceLevelFromGoogle(resolved.priceLevel),
    priceLevelKnown: hasPrice,
    imageUrl: resolved.imageUrl,
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    openNow: resolved.openNow ?? null,
  };
}

/**
 * Map a saved/rated Restaurant into a PlaceResult so it can join the tray.
 * Returns null when coordinates are missing.
 */
export function restaurantToPlaceResult(restaurant: Restaurant): PlaceResult | null {
  if (
    restaurant.latitude == null ||
    restaurant.longitude == null ||
    !Number.isFinite(restaurant.latitude) ||
    !Number.isFinite(restaurant.longitude)
  ) {
    return null;
  }
  return {
    googlePlaceId: restaurant.googlePlaceId ?? restaurant.id,
    name: restaurant.name,
    address: restaurant.address,
    city: restaurant.city,
    cuisine: restaurant.cuisine,
    priceLevel: restaurant.priceLevel,
    priceLevelKnown: true,
    imageUrl: restaurant.imageUrl,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    openNow: null,
  };
}

export function cameraTargetForResolvedPlace(
  resolved: ResolvedSearchPlace,
  token: number,
): DiscoverCameraTarget {
  if (resolved.viewport?.low && resolved.viewport?.high) {
    const { low, high } = resolved.viewport;
    const latitude = (low.latitude + high.latitude) / 2;
    const longitude = (low.longitude + high.longitude) / 2;
    const latitudeDelta = Math.max(Math.abs(high.latitude - low.latitude) * 1.2, 0.012);
    const longitudeDelta = Math.max(Math.abs(high.longitude - low.longitude) * 1.2, 0.012);
    return { latitude, longitude, latitudeDelta, longitudeDelta, token };
  }

  const delta = deltaForKind(resolved.kind, resolved.cuisineTypes);
  return {
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
    token,
  };
}

export function cameraTargetForCoordinate(
  coords: Coordinates,
  kind: PlaceSuggestionKind,
  token: number,
): DiscoverCameraTarget {
  const delta = deltaForKind(kind);
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
    token,
  };
}

function deltaForKind(kind: PlaceSuggestionKind, types: string[] = []): number {
  if (kind === "restaurant") return RESTAURANT_DELTA;
  if (kind === "address") return ADDRESS_DELTA;
  if (types.includes("locality") || types.includes("administrative_area_level_1")) {
    return CITY_DELTA;
  }
  if (kind === "area") return NEIGHBORHOOD_DELTA;
  return NEIGHBORHOOD_DELTA;
}

export function isRestaurantSearchResult(resolved: ResolvedSearchPlace): boolean {
  return resolved.kind === "restaurant" || classifyPlaceTypes(resolved.cuisineTypes) === "restaurant";
}

/** Radius for nearby restaurant fill after selecting a city/area/address. */
export function searchRadiusForResolvedPlace(resolved: ResolvedSearchPlace): number {
  if (resolved.viewport?.low && resolved.viewport?.high) {
    const latDelta = Math.abs(resolved.viewport.high.latitude - resolved.viewport.low.latitude);
    const lngDelta = Math.abs(resolved.viewport.high.longitude - resolved.viewport.low.longitude);
    const meters = Math.max(latDelta, lngDelta) * 111320 * 0.4;
    return Math.min(Math.max(Math.round(meters), 4000), MAX_DISCOVER_RADIUS_METERS);
  }
  if (isRestaurantSearchResult(resolved)) return 3000;
  if (resolved.kind === "address") return 4000;
  return Math.min(CITY_SEARCH_RADIUS_METERS, MAX_DISCOVER_RADIUS_METERS);
}

/** Location context for areas — never use the restaurant name. */
export function areaNearLabelFromResolved(resolved: ResolvedSearchPlace): string | null {
  if (isRestaurantSearchResult(resolved)) return null;
  const name = resolved.name?.trim();
  if (!name) return null;
  if (resolved.city && resolved.city.toLowerCase() !== name.toLowerCase()) {
    return `Near ${name}, ${resolved.city}`;
  }
  return `Near ${name}`;
}
