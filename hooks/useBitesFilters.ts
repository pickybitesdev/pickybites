import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EMPTY_BITES_FILTERS,
  countActiveFilters,
  type BitesFilterState,
} from "@/lib/bites-filters";
import type { BitesSegment } from "@/lib/bites";
import type {
  FavoritesSort,
  JournalSort,
  ListsSort,
  WantToTrySort,
} from "@/lib/bites-sort";

export function useBitesFilters() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<BitesFilterState>(EMPTY_BITES_FILTERS);
  const [draftFilters, setDraftFilters] = useState<BitesFilterState>(EMPTY_BITES_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [journalSort, setJournalSort] = useState<JournalSort>("newest");
  const [wantSort, setWantSort] = useState<WantToTrySort>("newest");
  const [favoritesSort, setFavoritesSort] = useState<FavoritesSort>("newest");
  const [listsSort, setListsSort] = useState<ListsSort>("newest");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const openFilters = useCallback(() => {
    setDraftFilters(filters);
    setFiltersOpen(true);
  }, [filters]);

  const applyFilters = useCallback(() => {
    setFilters(draftFilters);
    setFiltersOpen(false);
  }, [draftFilters]);

  const clearFilters = useCallback(() => {
    setDraftFilters(EMPTY_BITES_FILTERS);
    setFilters(EMPTY_BITES_FILTERS);
    setFiltersOpen(false);
  }, []);

  const getSortForSegment = useCallback(
    (segment: BitesSegment) => {
      if (segment === "journal") return journalSort;
      if (segment === "want_to_try") return wantSort;
      if (segment === "favorites") return favoritesSort;
      return listsSort;
    },
    [journalSort, wantSort, favoritesSort, listsSort],
  );

  const setSortForSegment = useCallback((segment: BitesSegment, value: string) => {
    if (segment === "journal") setJournalSort(value as JournalSort);
    else if (segment === "want_to_try") setWantSort(value as WantToTrySort);
    else if (segment === "favorites") setFavoritesSort(value as FavoritesSort);
    else setListsSort(value as ListsSort);
    setSortOpen(false);
  }, []);

  return {
    search,
    setSearch,
    debouncedSearch,
    filters,
    draftFilters,
    setDraftFilters,
    filtersOpen,
    setFiltersOpen,
    openFilters,
    applyFilters,
    clearFilters,
    activeFilterCount,
    sortOpen,
    setSortOpen,
    journalSort,
    wantSort,
    favoritesSort,
    listsSort,
    getSortForSegment,
    setSortForSegment,
  };
}
