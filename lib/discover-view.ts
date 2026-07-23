import { DISTANCE_OPTIONS } from "@/components/discover/DiscoverFilterPanel";
import type { DiscoverTab } from "@/lib/discover-curated";

export const DEFAULT_DISCOVER_RADIUS =
  DISTANCE_OPTIONS.find((o) => o.label === "3 mi")?.meters ?? 4828;

export type DiscoverViewMode = "map" | "list";

export const DEFAULT_DISCOVER_VIEW_MODE: DiscoverViewMode = "map";

export type DiscoverListSort = "recommended" | "distance" | "rating" | "match";

export const PLACES_UNAVAILABLE_MESSAGE = "Restaurant search is temporarily unavailable.";
export const PLACES_SIGN_IN_REQUIRED_MESSAGE = "Sign in to search restaurants.";
export const LOCATION_NEEDED_MESSAGE =
  "Allow location access when prompted, or search a city in the box above.";
export const LOCATION_NEEDED_NO_PLACES_MESSAGE =
  "Allow location access, then sign in (or add a Places key for local dev) and restart Expo.";

/** True when copy leaks env/config details that must not show in production UI. */
export function placesMessageLeaksConfig(message: string): boolean {
  return /EXPO_PUBLIC_|\.env|API[_ ]?KEY/i.test(message);
}

export function countActiveDiscoverFilters(opts: {
  cuisine: string | null;
  radiusMeters: number;
  curatedTab: DiscoverTab;
  openNowOnly?: boolean;
  /** When false, curated browse tabs do not count (map mode). */
  includeCuratedTab?: boolean;
  defaultRadius?: number;
}): number {
  const defaultRadius = opts.defaultRadius ?? DEFAULT_DISCOVER_RADIUS;
  let count = 0;
  if (opts.cuisine) count += 1;
  if (opts.radiusMeters !== defaultRadius) count += 1;
  if (opts.openNowOnly) count += 1;
  if (opts.includeCuratedTab !== false && opts.curatedTab !== "for-you") count += 1;
  return count;
}

/** Section eyebrow for list Near-you cards — prefer live area label. */
export function nearYouSectionLabel(nearLabel: string | null | undefined): string {
  if (!nearLabel?.trim()) return "Near you";
  const trimmed = nearLabel.trim();
  if (/^near\s+/i.test(trimmed)) return trimmed.replace(/^near\s+/i, "").trim() || "Near you";
  return trimmed;
}

export function pickSurpriseRestaurant<T>(items: T[], random = Math.random): T | null {
  if (!items.length) return null;
  const index = Math.floor(random() * items.length);
  return items[Math.min(index, items.length - 1)] ?? null;
}

export function toggleDiscoverViewMode(current: DiscoverViewMode): DiscoverViewMode {
  return current === "map" ? "list" : "map";
}

export const DISCOVER_LIST_SORT_OPTIONS: { value: DiscoverListSort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Rating" },
  { value: "match", label: "Match" },
];

export type SortablePlace = {
  distanceMeters?: number | null;
  rating?: number | null;
  matchPercent?: number | null;
};

export function sortDiscoverPlaces<T extends SortablePlace>(
  places: T[],
  sort: DiscoverListSort,
): T[] {
  const copy = [...places];
  if (sort === "recommended") return copy;
  copy.sort((a, b) => {
    if (sort === "distance") {
      return (a.distanceMeters ?? Number.POSITIVE_INFINITY) - (b.distanceMeters ?? Number.POSITIVE_INFINITY);
    }
    if (sort === "rating") {
      return (b.rating ?? -1) - (a.rating ?? -1);
    }
    return (b.matchPercent ?? -1) - (a.matchPercent ?? -1);
  });
  return copy;
}
