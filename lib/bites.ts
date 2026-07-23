import type { Href } from "expo-router";
import type { Bookmark } from "./types";

export type BitesSegment = "journal" | "want_to_try" | "favorites" | "lists";

/** User-facing names — keep internal segment keys stable for deep links / DB. */
export const TRY_NEXT_LABEL = "Try Next";
export const LOVES_LABEL = "Loves";

export const BITES_SEGMENTS: { value: BitesSegment; label: string }[] = [
  { value: "journal", label: "Journal" },
  { value: "want_to_try", label: TRY_NEXT_LABEL },
  { value: "favorites", label: LOVES_LABEL },
  { value: "lists", label: "Lists" },
];

/** Deep link into a Bites sub-tab (Journal / Try Next / Loves / Lists). */
export function bitesHref(segment: BitesSegment = "journal"): Href {
  return { pathname: "/(tabs)/bites", params: { segment } };
}

/** Bookmark button copy — maps to Try Next, not the whole Bites tab. */
export function wantToTryBookmarkLabel(isBookmarked: boolean): string {
  return isBookmarked ? `Remove from ${TRY_NEXT_LABEL}` : `Save to ${TRY_NEXT_LABEL}`;
}

/** Heart button copy — maps to Loves. */
export function lovesHeartLabel(isLoved: boolean): string {
  return isLoved ? `Remove from ${LOVES_LABEL}` : `Add to ${LOVES_LABEL}`;
}

export function bitesSegmentHint(segment: "want_to_try" | "favorites"): string {
  const label = segment === "want_to_try" ? TRY_NEXT_LABEL : LOVES_LABEL;
  return `Shows under Bites → ${label}`;
}

export type BitesCollections = {
  wantToTry: Bookmark[];
  /** Visited bookmarks kept after Mark Visited (may not have a Bite yet). */
  visited: Bookmark[];
};

/**
 * Try Next = saved spots not yet visited (or still planned).
 * Visited = marked visited; still owned even without a Bite review.
 * Loves are explicit hearts (favorites table), not visited bookmarks.
 */
export function getBitesCollections(bookmarks: Bookmark[]): BitesCollections {
  const wantToTry = bookmarks
    .filter((b) => b.status === "want_to_try" || b.status === "planned")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const visited = visitedBookmarks(bookmarks);

  return { wantToTry, visited };
}

/** Visited bookmarks, newest visit first. */
export function visitedBookmarks(bookmarks: Bookmark[]): Bookmark[] {
  return bookmarks
    .filter((b) => b.status === "visited")
    .sort((a, b) => {
      const aT = a.visitedAt ?? a.updatedAt;
      const bT = b.visitedAt ?? b.updatedAt;
      return new Date(bT).getTime() - new Date(aT).getTime();
    });
}

export function bitesCollectionIsEmpty(
  collections: BitesCollections,
  listCount: number,
  journalCount: number,
  favoritesCount: number,
): boolean {
  return (
    collections.wantToTry.length === 0 &&
    collections.visited.length === 0 &&
    listCount === 0 &&
    journalCount === 0 &&
    favoritesCount === 0
  );
}

export function selectBitesWantToTry(collections: BitesCollections): Bookmark[] {
  return collections.wantToTry;
}

export function selectBitesVisited(collections: BitesCollections): Bookmark[] {
  return collections.visited;
}
