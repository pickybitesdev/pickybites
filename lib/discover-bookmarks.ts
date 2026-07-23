/**
 * Build a set of bookmarked Google Place IDs.
 * Used so Discover result memos recompute when bookmarks change
 * (store `isBookmarked` fn identity is stable and won't bust useMemo alone).
 */
export function bookmarkedGooglePlaceIds(
  bookmarks: { googlePlaceId?: string | null }[],
): Set<string> {
  const ids = new Set<string>();
  for (const b of bookmarks) {
    if (b.googlePlaceId) ids.add(b.googlePlaceId);
  }
  return ids;
}
