import * as Location from "expo-location";
import type { Coordinates } from "@/lib/places/types";

export async function getCurrentCoordinates(): Promise<Coordinates | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
  };
}

export async function getCurrentCity(): Promise<string> {
  const coords = await getCurrentCoordinates();
  if (!coords) return "";

  const places = await Location.reverseGeocodeAsync(coords);
  const place = places[0];
  return place?.city ?? place?.subregion ?? place?.region ?? "";
}

/** Haversine distance in meters */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Fields used to build a compact Discover “Near …” label. */
export type NearGeocodeFields = {
  city?: string | null;
  district?: string | null;
  subregion?: string | null;
  region?: string | null;
  isoCountryCode?: string | null;
};

/**
 * Pure formatter for reverse-geocode results.
 * Examples: "Near Houston, TX", "Near Memorial, Houston"
 */
export function formatNearLocationLabel(
  place: NearGeocodeFields | null | undefined,
): string | null {
  if (!place) return null;
  const neighborhood = place.district?.trim() || null;
  const city = place.city?.trim() || place.subregion?.trim() || null;
  const region = place.region?.trim() || null;

  if (neighborhood && city && neighborhood.toLowerCase() !== city.toLowerCase()) {
    return `Near ${neighborhood}, ${city}`;
  }
  if (city && region && city.toLowerCase() !== region.toLowerCase()) {
    const regionPart = region.length <= 3 ? region.toUpperCase() : region;
    return `Near ${city}, ${regionPart}`;
  }
  if (city) return `Near ${city}`;
  if (region) return `Near ${region}`;
  return null;
}

/** Reverse-geocode coords into a compact “Near …” label, or null if unavailable. */
export async function getNearLocationLabel(
  coords: Coordinates | null | undefined,
): Promise<string | null> {
  if (!coords) return null;
  try {
    const places = await Location.reverseGeocodeAsync(coords);
    return formatNearLocationLabel(places[0] ?? null);
  } catch {
    return null;
  }
}

