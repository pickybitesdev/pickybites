import type { Bookmark } from "./types";
import type { FoodJournalEntry } from "./foodJournal";
import type { FavoriteDishItem, FavoriteRestaurantItem } from "./favorites";
import type { List } from "./types";

function normalize(q: string) {
  return q.trim().toLowerCase();
}

export function matchesJournalEntry(entry: FoodJournalEntry, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const hay = [
    entry.restaurant_name,
    entry.cuisine,
    entry.city,
    entry.review_text,
    ...entry.dishes.map((d) => d.dish_name),
    ...entry.tags,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function matchesBookmark(bookmark: Bookmark, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const hay = [
    bookmark.placeName,
    bookmark.placeCity,
    bookmark.placeCuisine ?? "",
    bookmark.reasonSaved,
    bookmark.placeAddress,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function matchesFavoriteRestaurant(item: FavoriteRestaurantItem, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const r = item.restaurant;
  return [r.name, r.city, r.cuisine, r.address].join(" ").toLowerCase().includes(q);
}

export function matchesFavoriteDish(item: FavoriteDishItem, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const hay = [item.dish.name, item.dish.notes, item.restaurant?.name ?? "", item.restaurant?.city ?? ""]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function matchesList(list: List, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  return `${list.name} ${list.description}`.toLowerCase().includes(q);
}
