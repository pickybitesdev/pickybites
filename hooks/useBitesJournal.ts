import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  getFoodJournalEntries,
  journalHasMapPins,
  FOOD_JOURNAL_EMPTY,
} from "@/lib/foodJournal";
import { applyJournalFilters, type BitesFilterState } from "@/lib/bites-filters";
import { matchesJournalEntry } from "@/lib/bites-search";
import { sortJournalEntries, type JournalSort } from "@/lib/bites-sort";

export function useBitesJournal(
  search: string,
  filters: BitesFilterState,
  sort: JournalSort,
) {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const reviews = useAppStore((s) => s.reviews);
  const restaurants = useAppStore((s) => s.restaurants);
  const dishes = useAppStore((s) => s.dishes);
  const reviewPhotos = useAppStore((s) => s.reviewPhotos);
  const isDataLoaded = useAppStore((s) => s.isDataLoaded);

  const allEntries = useMemo(() => {
    if (!currentUserId) return [];
    return getFoodJournalEntries(currentUserId, reviews, restaurants, dishes, reviewPhotos);
  }, [currentUserId, reviews, restaurants, dishes, reviewPhotos]);

  const filteredEntries = useMemo(() => {
    const searched = allEntries.filter((e) => matchesJournalEntry(e, search));
    const filtered = applyJournalFilters(searched, filters);
    return sortJournalEntries(filtered, sort);
  }, [allEntries, search, filters, sort]);

  const hasMapPins = useMemo(() => journalHasMapPins(allEntries), [allEntries]);

  return {
    allEntries,
    entries: filteredEntries,
    hasMapPins,
    isLoading: !isDataLoaded,
    isEmpty: allEntries.length === 0,
    isFilterEmpty: allEntries.length > 0 && filteredEntries.length === 0,
    emptyMessage: FOOD_JOURNAL_EMPTY,
  };
}
