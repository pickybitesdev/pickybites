import type { FoodJournalEntry } from "./foodJournal";
import type { Bookmark } from "./types";
import type { FavoriteDishItem, FavoriteRestaurantItem } from "./favorites";
import type { List } from "./types";

export type JournalSort = "newest" | "oldest" | "highest_rated" | "lowest_rated" | "name";
export type WantToTrySort = "newest" | "oldest" | "name" | "status";
export type FavoritesSort = "newest" | "oldest" | "name" | "highest_rated";
export type ListsSort = "newest" | "oldest" | "name";

export const JOURNAL_SORT_OPTIONS: { value: JournalSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest_rated", label: "Highest rated" },
  { value: "lowest_rated", label: "Lowest rated" },
  { value: "name", label: "Name A–Z" },
];

export const WANT_SORT_OPTIONS: { value: WantToTrySort; label: string }[] = [
  { value: "newest", label: "Newest saved" },
  { value: "oldest", label: "Oldest saved" },
  { value: "name", label: "Name A–Z" },
  { value: "status", label: "Status" },
];

export const FAVORITES_SORT_OPTIONS: { value: FavoritesSort; label: string }[] = [
  { value: "newest", label: "Recently favorited" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "highest_rated", label: "Highest rated" },
];

export const LISTS_SORT_OPTIONS: { value: ListsSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name A–Z" },
];

const STATUS_ORDER: Record<Bookmark["status"], number> = {
  planned: 0,
  want_to_try: 1,
  visited: 2,
};

export function sortJournalEntries(
  entries: FoodJournalEntry[],
  sort: JournalSort,
): FoodJournalEntry[] {
  const copy = [...entries];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime(),
      );
    case "highest_rated":
      return copy.sort((a, b) => b.normalized_rating - a.normalized_rating);
    case "lowest_rated":
      return copy.sort((a, b) => a.normalized_rating - b.normalized_rating);
    case "name":
      return copy.sort((a, b) => a.restaurant_name.localeCompare(b.restaurant_name));
    case "newest":
    default:
      return copy.sort(
        (a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime(),
      );
  }
}

export function sortBookmarks(bookmarks: Bookmark[], sort: WantToTrySort): Bookmark[] {
  const copy = [...bookmarks];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "name":
      return copy.sort((a, b) => a.placeName.localeCompare(b.placeName));
    case "status":
      return copy.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    case "newest":
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

export function sortFavoriteRestaurants(
  items: FavoriteRestaurantItem[],
  sort: FavoritesSort,
): FavoriteRestaurantItem[] {
  const copy = [...items];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "name":
      return copy.sort((a, b) => a.restaurant.name.localeCompare(b.restaurant.name));
    case "highest_rated":
      return copy;
    case "newest":
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

export function sortFavoriteDishes(
  items: FavoriteDishItem[],
  sort: FavoritesSort,
): FavoriteDishItem[] {
  const copy = [...items];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "name":
      return copy.sort((a, b) => a.dish.name.localeCompare(b.dish.name));
    case "highest_rated":
      return copy.sort((a, b) => b.dish.normalizedRating - a.dish.normalizedRating);
    case "newest":
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

export function sortLists(lists: List[], sort: ListsSort): List[] {
  const copy = [...lists];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}
