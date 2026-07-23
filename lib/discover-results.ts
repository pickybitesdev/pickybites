import type { PlaceResult } from "@/lib/places/types";

/** Hard ceiling for Discover map markers, tray cards, list rows, and count labels. */
export const DISCOVER_RESULT_LIMIT = 15;

export type RankableDiscoverPlace = {
  place: PlaceResult;
  distanceMeters?: number | null;
  rating?: number | null;
  matchPercent?: number | null;
};

/**
 * Sort by match (desc) → distance (asc) → rating (desc), then slice to DISCOVER_RESULT_LIMIT.
 */
export function rankAndCapDiscoverPlaces<T extends RankableDiscoverPlace>(items: T[]): T[] {
  const sorted = [...items].sort((a, b) => {
    const matchA = a.matchPercent ?? -1;
    const matchB = b.matchPercent ?? -1;
    if (matchA !== matchB) return matchB - matchA;

    const distA = a.distanceMeters ?? Number.POSITIVE_INFINITY;
    const distB = b.distanceMeters ?? Number.POSITIVE_INFINITY;
    if (distA !== distB) return distA - distB;

    const ratingA = a.rating ?? -1;
    const ratingB = b.rating ?? -1;
    return ratingB - ratingA;
  });
  return sorted.slice(0, DISCOVER_RESULT_LIMIT);
}

/** Cap any list to Discover's hard limit (e.g. after filters). */
export function capDiscoverResults<T>(items: T[]): T[] {
  return items.slice(0, DISCOVER_RESULT_LIMIT);
}
