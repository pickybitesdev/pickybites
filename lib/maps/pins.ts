import type { Restaurant } from "@/lib/types";
import type { PlaceResult } from "@/lib/places/types";
import { APP_NAME } from "@/constants/branding";

/**
 * Pin categories. Only `rated` and `nearby` are emitted today.
 * Future states (`saved`, `trending`, `friend`, `cuisine`) are reserved
 * for marker differentiation once product rules and data exist.
 */
export type MapPinType =
  | "rated"
  | "nearby"
  | "saved"
  | "trending"
  | "friend"
  | "cuisine";

export type MapPin = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  subtitle?: string;
  type: MapPinType;
};

export function isValidCoord(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export function buildMapPins(restaurants: Restaurant[], nearbyPlaces: PlaceResult[]): MapPin[] {
  const ratedIds = new Set<string>();

  const rated = restaurants
    .filter((r) => r.latitude != null && r.longitude != null && isValidCoord(r.latitude, r.longitude))
    .map((r) => {
      ratedIds.add(r.googlePlaceId ?? r.id);
      return {
        id: r.id,
        title: r.name,
        latitude: r.latitude!,
        longitude: r.longitude!,
        subtitle: `Rated on ${APP_NAME}`,
        type: "rated" as const,
      };
    });

  const nearby = nearbyPlaces
    .filter((p) => isValidCoord(p.latitude, p.longitude) && !ratedIds.has(p.googlePlaceId))
    .map((p) => ({
      id: p.googlePlaceId,
      title: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      subtitle: p.cuisine,
      type: "nearby" as const,
    }));

  return [...rated, ...nearby];
}

/** Discover map marker / tray hard ceiling (synced with DISCOVER_RESULT_LIMIT). */
export const MAX_MAP_MARKERS = 15;
