import type { PlaceResult, Coordinates } from "./types";
import { cuisineFromGoogleTypes, priceLevelFromGoogle, cityFromAddress } from "./cuisine-map";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import * as remote from "./remote";
import {
  mockNearbyPlaces,
  resolveYelpPlace,
  searchNearbyYelp,
  searchYelpSuggestions,
  isYelpPlaceId,
} from "./yelp";
import {
  classifyPlaceTypes,
  normalizePlaceResourceId,
  type PlaceSuggestion,
  type ResolvedSearchPlace,
} from "./autocomplete";

/** @deprecated Local dev only — production uses Supabase Edge Function `places`. */
function readLocalPlacesApiKey(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";
}

const BASE = "https://places.googleapis.com/v1";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.types",
  "places.primaryType",
  "places.photos",
  "places.priceLevel",
  "places.currentOpeningHours",
].join(",");

type GooglePlace = {
  id?: string;
  displayName?: { text: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
  primaryType?: string;
  priceLevel?: string | number;
  photos?: { name: string }[];
  currentOpeningHours?: { openNow?: boolean };
};

/** True when a usable local Places API key is present (not a placeholder). */
export function hasLocalPlacesApiKey(): boolean {
  const key = readLocalPlacesApiKey();
  return Boolean(key && !key.includes("your-google") && !key.includes("paste"));
}

/**
 * Infrastructure is present (Supabase/Yelp edge function or local Google key).
 * Does not guarantee the user can search — remote path still needs a real session.
 */
export function isGooglePlacesConfigured(): boolean {
  if (isSupabaseConfigured()) return true;
  return hasLocalPlacesApiKey();
}

export type PlacesSearchStatus = "ready" | "sign_in" | "unavailable";

export type PlacesSearchStatusOpts = {
  isAuthenticated: boolean;
  /**
   * When false (Try Demo / local mock), use demo pins — no Yelp session required.
   * When true, Discover uses Yelp via Supabase (requires real sign-in).
   */
  useRemotePlaces?: boolean;
};

/**
 * Whether restaurant search can run right now.
 * Remote = Yelp Edge Function (signed-in). Demo = mock pins.
 */
export function getPlacesSearchStatus(opts: PlacesSearchStatusOpts): PlacesSearchStatus {
  const useRemote = opts.useRemotePlaces ?? isSupabaseConfigured();
  if (useRemote && isSupabaseConfigured()) {
    return opts.isAuthenticated ? "ready" : "sign_in";
  }
  // Try Demo: mock nearby pins (no live Places/Yelp).
  return "ready";
}

export function isPlacesSearchReady(opts: PlacesSearchStatusOpts): boolean {
  return getPlacesSearchStatus(opts) === "ready";
}

/** Prefer Yelp Edge Function when a Supabase JWT exists. */
async function shouldUseRemotePlaces(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  return remote.hasPlacesAuthSession();
}

function photoUrl(photoName?: string): string | null {
  const key = readLocalPlacesApiKey();
  if (!photoName || !key) return null;
  return `${BASE}/${photoName}/media?maxWidthPx=600&key=${key}`;
}

function mapPlace(p: GooglePlace): PlaceResult | null {
  if (!p.id || !p.displayName?.text || !p.location) return null;
  const address = p.formattedAddress ?? p.shortFormattedAddress ?? "";
  const hasPrice = p.priceLevel != null && p.priceLevel !== "";
  return {
    googlePlaceId: p.id,
    name: p.displayName.text,
    address,
    city: cityFromAddress(address),
    cuisine: cuisineFromGoogleTypes(p.types, p.primaryType),
    priceLevel: priceLevelFromGoogle(p.priceLevel),
    priceLevelKnown: hasPrice,
    imageUrl: photoUrl(p.photos?.[0]?.name),
    latitude: p.location.latitude,
    longitude: p.location.longitude,
    openNow: p.currentOpeningHours?.openNow ?? null,
  };
}

async function localPlacesRequest(endpoint: string, body: object): Promise<PlaceResult[]> {
  if (!readLocalPlacesApiKey()) return [];

  const res = await fetch(`${BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": readLocalPlacesApiKey(),
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Google Places error:", res.status, err);
    throw new Error("Could not fetch nearby restaurants.");
  }

  const data = await res.json();
  return (data.places ?? []).map(mapPlace).filter(Boolean) as PlaceResult[];
}

export async function searchNearbyRestaurants(coords: Coordinates, radiusMeters = 1500): Promise<PlaceResult[]> {
  // Yelp-first (Google Places can be re-enabled later).
  if (await shouldUseRemotePlaces()) {
    return searchNearbyYelp(coords, radiusMeters);
  }
  // Try Demo — sample pins around the user so the map isn't empty.
  return mockNearbyPlaces(coords);
}

export async function searchRestaurantsByText(
  query: string,
  coords?: Coordinates,
  radiusMeters = 25000,
): Promise<PlaceResult[]> {
  if (await shouldUseRemotePlaces()) {
    if (!coords) return [];
    return searchNearbyYelp(coords, radiusMeters, query.trim() || "restaurants");
  }
  if (!coords) return [];
  const q = query.trim().toLowerCase();
  return mockNearbyPlaces(coords).filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.cuisine.toLowerCase().includes(q),
  );
}

/** Nearby search for map "Search this area". */
export async function searchAreaRestaurants(
  center: Coordinates,
  radiusMeters: number,
): Promise<PlaceResult[]> {
  return searchNearbyRestaurants(center, radiusMeters);
}

export async function fetchPlaceDetails(googlePlaceId: string): Promise<{
  photos: string[];
  openNow: boolean | null;
}> {
  if (isYelpPlaceId(googlePlaceId) && (await shouldUseRemotePlaces())) {
    const resolved = await resolveYelpPlace(googlePlaceId);
    return {
      photos: resolved?.imageUrl ? [resolved.imageUrl] : [],
      openNow: resolved?.openNow ?? null,
    };
  }

  if (await shouldUseRemotePlaces()) {
    try {
      return await remote.fetchDetailsRemote(googlePlaceId);
    } catch {
      return { photos: [], openNow: null };
    }
  }

  return { photos: [], openNow: null };
}

/** Debounced Discover autocomplete — Yelp restaurants when signed in. */
export async function autocompletePlaces(
  input: string,
  opts?: {
    coords?: Coordinates | null;
    sessionToken?: string;
    radiusMeters?: number;
  },
): Promise<PlaceSuggestion[]> {
  const q = input.trim();
  if (!q) return [];

  if (await shouldUseRemotePlaces()) {
    if (!opts?.coords) return [];
    return searchYelpSuggestions(q, opts.coords, opts.radiusMeters ?? 25000);
  }

  if (!opts?.coords) return [];
  const needle = q.toLowerCase();
  return mockNearbyPlaces(opts.coords)
    .filter((p) => p.name.toLowerCase().includes(needle) || p.city.toLowerCase().includes(needle))
    .slice(0, 8)
    .map((p) => ({
      id: p.googlePlaceId,
      placeId: p.googlePlaceId,
      primaryText: p.name,
      secondaryText: p.address || p.city,
      kinds: ["restaurant"],
      kind: "restaurant" as const,
    }));
}

/** Resolve a place id (after autocomplete or text search) into coordinates + metadata. */
export async function resolvePlaceDetails(
  googlePlaceId: string,
  sessionToken?: string,
): Promise<ResolvedSearchPlace | null> {
  if (isYelpPlaceId(googlePlaceId)) {
    if (await shouldUseRemotePlaces()) return resolveYelpPlace(googlePlaceId);
    return null;
  }

  if (googlePlaceId.startsWith("mock:") && (await shouldUseRemotePlaces()) === false) {
    // Demo resolve: rebuild mock set around a default and find by id — caller usually
    // already has coords from the suggestion list.
    const mocks = mockNearbyPlaces({ latitude: 29.76, longitude: -95.37 });
    const hit = mocks.find((p) => p.googlePlaceId === googlePlaceId);
    if (!hit) return null;
    return {
      placeId: hit.googlePlaceId,
      name: hit.name,
      address: hit.address,
      city: hit.city,
      latitude: hit.latitude,
      longitude: hit.longitude,
      cuisineTypes: [hit.cuisine],
      primaryType: "restaurant",
      imageUrl: hit.imageUrl,
      priceLevel: hit.priceLevel,
      openNow: hit.openNow ?? null,
      viewport: null,
      kind: "restaurant",
    };
  }

  if (await shouldUseRemotePlaces()) {
    try {
      return await remote.resolvePlaceRemote(googlePlaceId, sessionToken);
    } catch {
      return null;
    }
  }

  return null;
}

/** Free-text resolve for keyboard Search — Yelp term search when signed in. */
export async function searchPlacesByText(
  query: string,
  coords?: Coordinates,
  radiusMeters = 25000,
): Promise<ResolvedSearchPlace[]> {
  const q = query.trim();
  if (!q) return [];

  if (await shouldUseRemotePlaces()) {
    if (!coords) return [];
    const places = await searchNearbyYelp(coords, radiusMeters, q);
    return places.map((p) => ({
      placeId: p.googlePlaceId,
      name: p.name,
      address: p.address,
      city: p.city,
      latitude: p.latitude,
      longitude: p.longitude,
      cuisineTypes: [p.cuisine],
      primaryType: "restaurant",
      imageUrl: p.imageUrl,
      priceLevel: p.priceLevel,
      openNow: p.openNow ?? null,
      viewport: null,
      kind: "restaurant" as const,
    }));
  }

  if (!coords) return [];
  const needle = q.toLowerCase();
  return mockNearbyPlaces(coords)
    .filter((p) => p.name.toLowerCase().includes(needle) || p.city.toLowerCase().includes(needle))
    .map((p) => ({
      placeId: p.googlePlaceId,
      name: p.name,
      address: p.address,
      city: p.city,
      latitude: p.latitude,
      longitude: p.longitude,
      cuisineTypes: [p.cuisine],
      primaryType: "restaurant",
      imageUrl: p.imageUrl,
      priceLevel: p.priceLevel,
      openNow: p.openNow ?? null,
      viewport: null,
      kind: "restaurant" as const,
    }));
}

function mapResolvedPlace(p: {
  id?: string;
  name?: string;
  displayName?: { text: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  viewport?: {
    low?: { latitude: number; longitude: number };
    high?: { latitude: number; longitude: number };
  };
  types?: string[];
  primaryType?: string;
  priceLevel?: string | number;
  photos?: { name: string }[];
  currentOpeningHours?: { openNow?: boolean };
}): ResolvedSearchPlace | null {
  const placeId = normalizePlaceResourceId(p.id ?? p.name ?? "");
  if (!placeId || !p.displayName?.text || !p.location) return null;
  const address = p.formattedAddress ?? p.shortFormattedAddress ?? "";
  const types = p.types ?? [];
  const viewport =
    p.viewport?.low && p.viewport?.high
      ? {
          low: {
            latitude: p.viewport.low.latitude,
            longitude: p.viewport.low.longitude,
          },
          high: {
            latitude: p.viewport.high.latitude,
            longitude: p.viewport.high.longitude,
          },
        }
      : null;
  return {
    placeId,
    name: p.displayName.text,
    address,
    city: cityFromAddress(address),
    latitude: p.location.latitude,
    longitude: p.location.longitude,
    cuisineTypes: types,
    primaryType: p.primaryType ?? null,
    imageUrl: photoUrl(p.photos?.[0]?.name),
    priceLevel: p.priceLevel ?? null,
    openNow: p.currentOpeningHours?.openNow ?? null,
    viewport,
    kind: classifyPlaceTypes(types),
  };
}

