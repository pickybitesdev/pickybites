import type { Coordinates, PlaceResult } from "./types";
import { distanceMeters } from "@/lib/location";
import { DISCOVER_RESULT_LIMIT } from "@/lib/discover-results";

export const METERS_PER_MILE = 1609.34;
export const MAX_DISCOVER_RADIUS_METERS = Math.round(METERS_PER_MILE * 10);

const CARDINAL = [0, 90, 180, 270] as const;
const OCTANT = [0, 45, 90, 135, 180, 225, 270, 315] as const;

/** Discover map/tray hard ceiling — never merge more than this many places. */
export function mergeLimitForRadius(_radiusMeters: number): number {
  return DISCOVER_RESULT_LIMIT;
}

export type NearbySearchRequest = {
  center: Coordinates;
  radiusMeters: number;
  rankPreference: "DISTANCE" | "POPULARITY";
};

/** Offset a coordinate by bearing (degrees) and distance (meters). */
export function offsetCoordinate(coords: Coordinates, bearingDeg: number, meters: number): Coordinates {
  const R = 6371000;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (coords.latitude * Math.PI) / 180;
  const lon1 = (coords.longitude * Math.PI) / 180;
  const d = meters / R;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: (lon2 * 180) / Math.PI,
  };
}

function pushSectorRing(
  plan: NearbySearchRequest[],
  origin: Coordinates,
  totalRadius: number,
  ringFraction: number,
  bearings: readonly number[],
) {
  const offsetDist = totalRadius * ringFraction;
  const sectorRadius = Math.round(
    Math.min(Math.max(totalRadius * 0.34, 2200), totalRadius * 0.48),
  );
  for (const bearing of bearings) {
    plan.push({
      center: offsetCoordinate(origin, bearing, offsetDist),
      radiusMeters: sectorRadius,
      rankPreference: "DISTANCE",
    });
  }
}

/**
 * Google Nearby Search (New) returns max 20 results per call with no pagination.
 * Fan out across distance rings so 3–5 mi spots aren't drowned out by the closest 20.
 */
export function buildNearbySearchPlan(coords: Coordinates, radiusMeters: number): NearbySearchRequest[] {
  const radius = Math.min(Math.max(radiusMeters, 100), MAX_DISCOVER_RADIUS_METERS);
  const plan: NearbySearchRequest[] = [
    { center: coords, radiusMeters: radius, rankPreference: "DISTANCE" },
    { center: coords, radiusMeters: radius, rankPreference: "POPULARITY" },
  ];

  if (radius >= 2500) {
    pushSectorRing(plan, coords, radius, 0.35, CARDINAL);
  }
  if (radius >= 4500) {
    // ~3 mi ring when radius is 5 mi — targets the 2–5 mi band
    pushSectorRing(plan, coords, radius, 0.55, OCTANT);
    pushSectorRing(plan, coords, radius, 0.75, CARDINAL);
  }
  if (radius >= 9000) {
    pushSectorRing(plan, coords, radius, 0.85, OCTANT);
  }

  return plan;
}

/** Keep spots from every distance band, not only the closest N. */
function pickAcrossDistanceRings(
  places: PlaceResult[],
  origin: Coordinates,
  radiusMeters: number,
  maxCount: number,
): PlaceResult[] {
  const numRings = Math.min(8, Math.max(4, Math.ceil(radiusMeters / 2000)));
  const ringWidth = radiusMeters / numRings;
  const buckets: PlaceResult[][] = Array.from({ length: numRings }, () => []);

  for (const place of places) {
    const d = distanceMeters(origin, place);
    const idx = Math.min(numRings - 1, Math.floor(d / ringWidth));
    buckets[idx].push(place);
  }

  buckets.forEach((bucket) =>
    bucket.sort((a, b) => distanceMeters(origin, a) - distanceMeters(origin, b)),
  );

  const perRing = Math.max(6, Math.ceil(maxCount / numRings));
  const picked: PlaceResult[] = [];
  const seen = new Set<string>();

  for (let r = 0; r < numRings; r++) {
    let taken = 0;
    for (const place of buckets[r]) {
      if (seen.has(place.googlePlaceId)) continue;
      seen.add(place.googlePlaceId);
      picked.push(place);
      taken++;
      if (taken >= perRing) break;
    }
  }

  if (picked.length < maxCount) {
    const sorted = [...places].sort(
      (a, b) => distanceMeters(origin, a) - distanceMeters(origin, b),
    );
    for (const place of sorted) {
      if (seen.has(place.googlePlaceId)) continue;
      seen.add(place.googlePlaceId);
      picked.push(place);
      if (picked.length >= maxCount) break;
    }
  }

  return picked.sort((a, b) => distanceMeters(origin, a) - distanceMeters(origin, b));
}

export function mergePlacesWithinRadius(
  batches: PlaceResult[][],
  origin: Coordinates,
  radiusMeters: number,
  limit = mergeLimitForRadius(radiusMeters),
): PlaceResult[] {
  const seen = new Set<string>();
  const merged: PlaceResult[] = [];

  for (const batch of batches) {
    for (const place of batch) {
      if (seen.has(place.googlePlaceId)) continue;
      const dist = distanceMeters(origin, place);
      if (dist > radiusMeters) continue;
      seen.add(place.googlePlaceId);
      merged.push(place);
    }
  }

  if (merged.length <= limit) {
    return merged.sort((a, b) => distanceMeters(origin, a) - distanceMeters(origin, b));
  }

  return pickAcrossDistanceRings(merged, origin, radiusMeters, limit);
}

/** Estimate search radius (meters) from a map region's visible bounds. */
export function regionToSearchRadius(region: {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}): number {
  const latMeters = (region.latitudeDelta / 2) * 111320;
  const lngMeters =
    (region.longitudeDelta / 2) * 111320 * Math.cos((region.latitude * Math.PI) / 180);
  const radius = Math.max(latMeters, lngMeters);
  return Math.min(Math.max(Math.round(radius), 500), MAX_DISCOVER_RADIUS_METERS);
}

