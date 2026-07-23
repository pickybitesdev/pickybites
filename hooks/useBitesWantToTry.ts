import { useMemo } from "react";
import { useSavedRestaurants } from "@/hooks/useSavedRestaurants";
import { getBitesCollections } from "@/lib/bites";
import { applyBookmarkFilters, type BitesFilterState } from "@/lib/bites-filters";
import { matchesBookmark } from "@/lib/bites-search";
import { sortBookmarks, type WantToTrySort } from "@/lib/bites-sort";

export function useBitesWantToTry(
  search: string,
  filters: BitesFilterState,
  sort: WantToTrySort,
) {
  const { saved, updateStatus, remove } = useSavedRestaurants();

  const collections = useMemo(() => getBitesCollections(saved), [saved]);

  const items = useMemo(() => {
    const searched = collections.wantToTry.filter((b) => matchesBookmark(b, search));
    const filtered = applyBookmarkFilters(searched, filters);
    return sortBookmarks(filtered, sort);
  }, [collections.wantToTry, search, filters, sort]);

  const visitedItems = useMemo(() => {
    // Status filter: if user picks only want_to_try/planned, hide visited section.
    if (
      filters.bookmarkStatuses.length > 0 &&
      !filters.bookmarkStatuses.includes("visited")
    ) {
      return [];
    }
    const searched = collections.visited.filter((b) => matchesBookmark(b, search));
    return applyBookmarkFilters(searched, {
      ...filters,
      // Avoid double-excluding when statuses filter is empty or includes visited.
      bookmarkStatuses: filters.bookmarkStatuses.includes("visited")
        ? ["visited"]
        : filters.bookmarkStatuses.length === 0
          ? []
          : filters.bookmarkStatuses,
    });
  }, [collections.visited, search, filters]);

  const allActiveCount = collections.wantToTry.length;
  const allVisitedCount = collections.visited.length;
  const isEmpty = allActiveCount === 0 && allVisitedCount === 0;
  const isFilterEmpty =
    !isEmpty && items.length === 0 && visitedItems.length === 0;

  return {
    items,
    visitedItems,
    allCount: allActiveCount,
    visitedCount: allVisitedCount,
    isEmpty,
    isFilterEmpty,
    updateStatus,
    remove,
  };
}
