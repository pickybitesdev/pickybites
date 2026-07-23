import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Cuisine, PriceLevel } from "@/lib/types";
import type { FeedBalance, FeedDistancePref } from "@/lib/feed/types";

export type FeedSort = "newest" | "best_match";

export type FeedPreferences = {
  /** Legacy For You mix knob — kept for storage compat; Feed is friends-only. */
  balance: FeedBalance;
  sort: FeedSort;
  cuisineOverrides: Cuisine[];
  distance: FeedDistancePref;
  priceLevels: PriceLevel[];
  /** Legacy discovery toggles — kept for storage compat; not shown in UI. */
  hiddenGems: boolean;
  trending: boolean;
  veganFriendly: boolean;
  dateNight: boolean;
  /** Always false until privacy opt-in exists; bookmarks are private. */
  showFriendSaves: boolean;
  showDishRecs: boolean;
};

export const DEFAULT_FEED_PREFERENCES: FeedPreferences = {
  balance: "friends",
  sort: "newest",
  cuisineOverrides: [],
  distance: "any",
  priceLevels: [],
  hiddenGems: false,
  trending: false,
  veganFriendly: false,
  dateNight: false,
  showFriendSaves: false,
  showDishRecs: true,
};

export const FEED_SORT_OPTIONS: { label: string; value: FeedSort }[] = [
  { label: "Newest", value: "newest" },
  { label: "Best match", value: "best_match" },
];

export const FEED_DISTANCE_OPTIONS: { label: string; value: FeedDistancePref }[] = [
  { label: "Nearby", value: "nearby" },
  { label: "Up to 5 miles", value: "5mi" },
  { label: "Up to 10 miles", value: "10mi" },
  { label: "Any distance", value: "any" },
];

export const FEED_PRICE_OPTIONS: { label: string; value: PriceLevel }[] = [
  { label: "$", value: 1 },
  { label: "$$", value: 2 },
  { label: "$$$", value: 3 },
  { label: "$$$$", value: 4 },
];

const key = (userId: string) => `@pickybites/feed_prefs/${userId}`;

function normalizePrefs(parsed: Partial<FeedPreferences>): FeedPreferences {
  return {
    ...DEFAULT_FEED_PREFERENCES,
    ...parsed,
    // Friends-only Feed — pin dead For You knobs so they cannot resurrect.
    balance: "friends",
    hiddenGems: false,
    trending: false,
    veganFriendly: false,
    dateNight: false,
    showFriendSaves: false,
    sort: parsed.sort === "best_match" ? "best_match" : "newest",
    cuisineOverrides: parsed.cuisineOverrides ?? [],
    priceLevels: parsed.priceLevels ?? [],
  };
}

export async function loadFeedPreferences(userId: string): Promise<FeedPreferences> {
  const raw = await AsyncStorage.getItem(key(userId));
  if (!raw) return { ...DEFAULT_FEED_PREFERENCES };
  try {
    const parsed = JSON.parse(raw) as Partial<FeedPreferences>;
    return normalizePrefs(parsed);
  } catch {
    return { ...DEFAULT_FEED_PREFERENCES };
  }
}

export async function saveFeedPreferences(userId: string, prefs: FeedPreferences): Promise<void> {
  await AsyncStorage.setItem(
    key(userId),
    JSON.stringify(normalizePrefs(prefs)),
  );
}

export function resetFeedPreferences(): FeedPreferences {
  return { ...DEFAULT_FEED_PREFERENCES };
}

/** True when user-facing customize filters differ from defaults. */
export function hasActiveFeedFilters(prefs: FeedPreferences): boolean {
  return countActiveFeedFilters(prefs) > 0;
}

/** Number of active Customize Feed filters (for badge). */
export function countActiveFeedFilters(prefs: FeedPreferences): number {
  let count = 0;
  if (prefs.sort !== "newest") count += 1;
  if (prefs.cuisineOverrides.length > 0) count += 1;
  if (prefs.priceLevels.length > 0) count += 1;
  if (prefs.distance !== "any") count += 1;
  return count;
}

const PRICE_LABEL: Record<PriceLevel, string> = {
  1: "$",
  2: "$$",
  3: "$$$",
  4: "$$$$",
};

const DISTANCE_LABEL: Record<FeedDistancePref, string> = {
  nearby: "Nearby",
  "5mi": "Up to 5 mi",
  "10mi": "Up to 10 mi",
  any: "Any distance",
};

/** Compact chips summarizing active filters (for header strip). */
export function summarizeFeedFilters(prefs: FeedPreferences): string[] {
  const chips: string[] = [];
  if (prefs.sort === "best_match") chips.push("Best match");
  if (prefs.cuisineOverrides.length === 1) {
    chips.push(prefs.cuisineOverrides[0]!);
  } else if (prefs.cuisineOverrides.length > 1) {
    chips.push(`${prefs.cuisineOverrides.length} cuisines`);
  }
  if (prefs.priceLevels.length > 0) {
    chips.push(
      [...prefs.priceLevels]
        .sort((a, b) => a - b)
        .map((p) => PRICE_LABEL[p])
        .join(" · "),
    );
  }
  if (prefs.distance !== "any") chips.push(DISTANCE_LABEL[prefs.distance]);
  return chips;
}
