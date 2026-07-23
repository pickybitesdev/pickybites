import type { ReviewVisibility } from "./types";
import type { FoodJournalEntry } from "./foodJournal";
import type { Bookmark } from "./types";
import type { FavoriteDishItem, FavoriteRestaurantItem } from "./favorites";
import { tenPointFromNormalized } from "./rating-scale";

export type BitesFilterState = {
  cuisines: string[];
  cities: string[];
  minRating: number | null;
  maxRating: number | null;
  visibility: ReviewVisibility[];
  dateFrom: string | null;
  dateTo: string | null;
  bookmarkStatuses: Bookmark["status"][];
};

export const EMPTY_BITES_FILTERS: BitesFilterState = {
  cuisines: [],
  cities: [],
  minRating: null,
  maxRating: null,
  visibility: [],
  dateFrom: null,
  dateTo: null,
  bookmarkStatuses: [],
};

export function countActiveFilters(filters: BitesFilterState): number {
  let n = 0;
  if (filters.cuisines.length) n += 1;
  if (filters.cities.length) n += 1;
  if (filters.minRating != null || filters.maxRating != null) n += 1;
  if (filters.visibility.length) n += 1;
  if (filters.dateFrom || filters.dateTo) n += 1;
  if (filters.bookmarkStatuses.length) n += 1;
  return n;
}

function inDateRange(isoDate: string, from: string | null, to: string | null): boolean {
  const t = new Date(isoDate).getTime();
  if (from && t < new Date(from).getTime()) return false;
  if (to && t > new Date(to).getTime()) return false;
  return true;
}

export function applyJournalFilters(
  entries: FoodJournalEntry[],
  filters: BitesFilterState,
): FoodJournalEntry[] {
  return entries.filter((e) => {
    if (filters.cuisines.length && !filters.cuisines.includes(e.cuisine)) return false;
    if (filters.cities.length && !filters.cities.includes(e.city)) return false;
    const score10 = tenPointFromNormalized(e.normalized_rating);
    if (filters.minRating != null && score10 < filters.minRating) return false;
    if (filters.maxRating != null && score10 > filters.maxRating) return false;
    if (filters.visibility.length && !filters.visibility.includes(e.visibility)) return false;
    if (!inDateRange(e.visit_date, filters.dateFrom, filters.dateTo)) return false;
    return true;
  });
}

export function applyBookmarkFilters(
  bookmarks: Bookmark[],
  filters: BitesFilterState,
): Bookmark[] {
  return bookmarks.filter((b) => {
    if (filters.cuisines.length && b.placeCuisine && !filters.cuisines.includes(b.placeCuisine)) {
      return false;
    }
    if (filters.cities.length && !filters.cities.includes(b.placeCity)) return false;
    if (filters.bookmarkStatuses.length && !filters.bookmarkStatuses.includes(b.status)) return false;
    if (!inDateRange(b.createdAt, filters.dateFrom, filters.dateTo)) return false;
    return true;
  });
}

export function applyFavoriteRestaurantFilters(
  items: FavoriteRestaurantItem[],
  filters: BitesFilterState,
): FavoriteRestaurantItem[] {
  return items.filter((item) => {
    const r = item.restaurant;
    if (filters.cuisines.length && !filters.cuisines.includes(r.cuisine)) return false;
    if (filters.cities.length && !filters.cities.includes(r.city)) return false;
    if (!inDateRange(item.createdAt, filters.dateFrom, filters.dateTo)) return false;
    return true;
  });
}

export function applyFavoriteDishFilters(
  items: FavoriteDishItem[],
  filters: BitesFilterState,
): FavoriteDishItem[] {
  return items.filter((item) => {
    const cuisine = item.restaurant?.cuisine;
    const city = item.restaurant?.city;
    if (filters.cuisines.length && cuisine && !filters.cuisines.includes(cuisine)) return false;
    if (filters.cities.length && city && !filters.cities.includes(city)) return false;
    if (filters.minRating != null && item.dish.normalizedRating < filters.minRating) return false;
    if (filters.maxRating != null && item.dish.normalizedRating > filters.maxRating) return false;
    if (!inDateRange(item.createdAt, filters.dateFrom, filters.dateTo)) return false;
    return true;
  });
}
