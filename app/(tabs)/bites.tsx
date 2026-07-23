import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, ScrollView, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import { useAppStore } from "@/store/useAppStore";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { BitesHeader } from "@/components/bites/BitesHeader";
import { BitesSearchBar } from "@/components/bites/BitesSearchBar";
import { BitesFiltersSheet } from "@/components/bites/BitesFiltersSheet";
import { BitesSortSheet } from "@/components/bites/BitesSortSheet";
import { BitesJournalSection } from "@/components/bites/BitesJournalSection";
import { BitesJournalMap } from "@/components/bites/BitesJournalMap";
import {
  BitesWantToTrySection,
} from "@/components/bites/BitesWantToTrySection";
import { PlanVisitSheet } from "@/components/bites/PlanVisitSheet";
import { VisitedFollowUpSheet } from "@/components/bites/VisitedFollowUpSheet";
import { BitesFavoritesSection } from "@/components/bites/BitesFavoritesSection";
import { BitesListsSection } from "@/components/bites/BitesListsSection";
import { useBitesFilters } from "@/hooks/useBitesFilters";
import { useBitesJournal } from "@/hooks/useBitesJournal";
import { useBitesWantToTry } from "@/hooks/useBitesWantToTry";
import { useBitesFavorites, type FavoritesSubSegment } from "@/hooks/useBitesFavorites";
import { BITES_SEGMENTS, type BitesSegment } from "@/lib/bites";
import { matchesList } from "@/lib/bites-search";
import { sortLists } from "@/lib/bites-sort";
import { getCurrentCoordinates } from "@/lib/location";
import { TAB_SCROLL_BOTTOM_PADDING } from "@/lib/tab-bar";
import { addBiteHref } from "@/lib/add-actions";
import { addPlanToCalendar } from "@/lib/calendar-event";
import { plannedAtFromIsoDate } from "@/lib/plan-visit";
import type { Coordinates } from "@/lib/places/types";
import type { Bookmark } from "@/lib/types";
import { useThemedColors } from "@/lib/useThemedColors";
import { ui } from "@/constants/ui";
import { hapticSuccess } from "@/lib/haptics";

function parseSegment(raw: string | string[] | undefined): BitesSegment {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "want_to_try" || value === "favorites" || value === "lists" || value === "journal") {
    return value;
  }
  return "journal";
}

export default function BitesScreen() {
  const colors = useThemedColors();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const params = useLocalSearchParams<{ segment?: string }>();
  const [segment, setSegment] = useState<BitesSegment>(() => parseSegment(params.segment));
  const [mapMode, setMapMode] = useState(false);
  const [favoritesSub, setFavoritesSub] = useState<FavoritesSubSegment>("restaurants");
  const [planTarget, setPlanTarget] = useState<Bookmark | null>(null);
  const [visitedFollowUp, setVisitedFollowUp] = useState<{
    placeName: string;
    restaurantId: string | null;
    bookmarkId: string;
  } | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);

  const {
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
  } = useBitesFilters();

  const ensureRestaurantFromPlace = useAppStore((s) => s.ensureRestaurantFromPlace);
  const getMyLists = useAppStore((s) => s.getMyLists);
  const listItems = useAppStore((s) => s.listItems);
  const getRestaurant = useAppStore((s) => s.getRestaurant);
  const refreshFeed = useAppStore((s) => s.refreshFeed);
  const isRefreshing = useAppStore((s) => s.isRefreshing);

  const journal = useBitesJournal(debouncedSearch, filters, journalSort);
  const wantToTry = useBitesWantToTry(debouncedSearch, filters, wantSort);
  const favoritesData = useBitesFavorites(debouncedSearch, filters, favoritesSort, favoritesSub);

  const userLists = getMyLists();
  const filteredLists = useMemo(() => {
    const matched = userLists.filter((l) => matchesList(l, debouncedSearch));
    return sortLists(matched, listsSort);
  }, [userLists, debouncedSearch, listsSort]);

  useEffect(() => {
    const next = parseSegment(params.segment);
    setSegment(next);
    if (next !== "journal") setMapMode(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [params.segment]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [segment]);

  useEffect(() => {
    getCurrentCoordinates().then(setCoords);
  }, []);

  const cuisineOptions = useMemo(() => {
    if (segment === "journal") {
      return [...new Set(journal.allEntries.map((e) => e.cuisine).filter(Boolean))].sort();
    }
    if (segment === "want_to_try") {
      return [
        ...new Set(wantToTry.items.map((b) => b.placeCuisine).filter(Boolean) as string[]),
      ].sort();
    }
    return [
      ...new Set([
        ...favoritesData.restaurantItems.map((i) => i.restaurant.cuisine),
        ...favoritesData.dishItems.map((i) => i.restaurant?.cuisine).filter(Boolean) as string[],
      ]),
    ].sort();
  }, [segment, journal.allEntries, wantToTry.items, favoritesData.restaurantItems, favoritesData.dishItems]);

  const cityOptions = useMemo(() => {
    if (segment === "journal") {
      return [...new Set(journal.allEntries.map((e) => e.city).filter(Boolean))].sort();
    }
    if (segment === "want_to_try") {
      return [...new Set(wantToTry.items.map((b) => b.placeCity).filter(Boolean))].sort();
    }
    return [
      ...new Set([
        ...favoritesData.restaurantItems.map((i) => i.restaurant.city),
        ...favoritesData.dishItems.map((i) => i.restaurant?.city).filter(Boolean) as string[],
      ]),
    ].sort();
  }, [segment, journal.allEntries, wantToTry.items, favoritesData.restaurantItems, favoritesData.dishItems]);

  const resolveRestaurantId = useCallback(
    async (bookmark: Bookmark): Promise<string | null> => {
      if (bookmark.restaurantId) return bookmark.restaurantId;
      if (!bookmark.googlePlaceId || bookmark.latitude == null || bookmark.longitude == null) {
        return null;
      }
      const result = await ensureRestaurantFromPlace({
        googlePlaceId: bookmark.googlePlaceId,
        name: bookmark.placeName,
        address: bookmark.placeAddress,
        city: bookmark.placeCity,
        cuisine: bookmark.placeCuisine ?? "American",
        priceLevel: bookmark.placePriceLevel ?? 2,
        imageUrl: bookmark.placeImageUrl,
        latitude: bookmark.latitude,
        longitude: bookmark.longitude,
      });
      if ("error" in result) return null;
      return result.id;
    },
    [ensureRestaurantFromPlace],
  );

  const openBookmark = useCallback(
    async (bookmark: Bookmark) => {
      const restaurantId = await resolveRestaurantId(bookmark);
      if (restaurantId) router.push(`/restaurant/${restaurantId}`);
    },
    [resolveRestaurantId],
  );

  const handleMarkPlanned = useCallback((bookmark: Bookmark) => {
    setPlanTarget(bookmark);
  }, []);

  const confirmPlanVisit = useCallback(
    async (opts: { dateIso: string; addToCalendar: boolean }) => {
      const bookmark = planTarget;
      if (!bookmark) return;
      setPlanTarget(null);

      const plannedAt = plannedAtFromIsoDate(opts.dateIso);
      const result = await wantToTry.updateStatus(bookmark.id, "planned", { plannedAt });
      if (!result.ok) {
        Alert.alert("Error", result.error);
        return;
      }
      hapticSuccess();

      if (opts.addToCalendar) {
        await addPlanToCalendar({
          placeName: bookmark.placeName,
          dateIso: opts.dateIso,
          address: bookmark.placeAddress,
          city: bookmark.placeCity,
        });
      }
    },
    [planTarget, wantToTry],
  );

  const handleMarkVisited = useCallback(
    async (bookmark: Bookmark) => {
      const restaurantId = await resolveRestaurantId(bookmark);
      const result = await wantToTry.updateStatus(bookmark.id, "visited", {
        restaurantId: restaurantId ?? undefined,
      });
      if (!result.ok) {
        Alert.alert("Error", result.error);
        return;
      }
      hapticSuccess();
      setVisitedFollowUp({
        placeName: bookmark.placeName,
        restaurantId: restaurantId ?? result.restaurantId,
        bookmarkId: bookmark.id,
      });
    },
    [wantToTry, resolveRestaurantId],
  );

  const handleLeaveReview = useCallback(
    async (bookmark: Bookmark) => {
      const restaurantId =
        bookmark.restaurantId ?? (await resolveRestaurantId(bookmark));
      if (restaurantId && !bookmark.restaurantId) {
        await wantToTry.updateStatus(bookmark.id, "visited", { restaurantId });
      }
      // Always pass bookmarkId so Add a Bite can prefill from place fields
      // even when the restaurant row isn't in the store yet.
      router.push(
        addBiteHref({
          restaurantId: restaurantId ?? bookmark.restaurantId,
          bookmarkId: bookmark.id,
        }),
      );
    },
    [resolveRestaurantId, wantToTry],
  );

  const handleMoveToWantToTry = useCallback(
    async (bookmark: Bookmark) => {
      const result = await wantToTry.updateStatus(bookmark.id, "want_to_try");
      if (!result.ok) {
        Alert.alert("Error", result.error);
        return;
      }
      hapticSuccess();
    },
    [wantToTry],
  );

  const onRefresh = useCallback(() => {
    void refreshFeed();
  }, [refreshFeed]);

  const showMapToggle = segment === "journal" && journal.hasMapPins && !journal.isEmpty;

  return (
    <SafeAreaView className={`flex-1 ${ui.screen}`} edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_SCROLL_BOTTOM_PADDING }}
        contentContainerClassName="px-4 gap-5 pt-2"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.spinner} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <BitesHeader
          showMapToggle={showMapToggle}
          mapMode={mapMode}
          onToggleMap={() => setMapMode((m) => !m)}
        />

        <SegmentedControl
          options={BITES_SEGMENTS}
          value={segment}
          onChange={(value) => {
            setSegment(value);
            if (value !== "journal") setMapMode(false);
            scrollRef.current?.scrollTo({ y: 0, animated: false });
          }}
          variant="brand"
        />

        <BitesSearchBar
          value={search}
          onChangeText={setSearch}
          filterCount={activeFilterCount}
          onOpenFilters={openFilters}
          onOpenSort={() => setSortOpen(true)}
        />

        {segment === "journal" && mapMode ? (
          <BitesJournalMap entries={journal.entries} coords={coords} />
        ) : null}

        {segment === "journal" && !mapMode ? (
          <BitesJournalSection
            months={journal.months}
            stats={journal.stats}
            reviewCount={journal.allEntries.length}
            isEmpty={journal.isEmpty}
            isFilterEmpty={journal.isFilterEmpty}
            hasSearch={Boolean(debouncedSearch.trim())}
            emptyMessage={journal.emptyMessage}
          />
        ) : null}

        {segment === "want_to_try" ? (
          <BitesWantToTrySection
            items={wantToTry.items}
            visitedItems={wantToTry.visitedItems}
            isEmpty={wantToTry.isEmpty}
            isFilterEmpty={wantToTry.isFilterEmpty}
            hasSearch={Boolean(debouncedSearch.trim())}
            coords={coords}
            onOpen={openBookmark}
            onMarkPlanned={handleMarkPlanned}
            onMarkVisited={handleMarkVisited}
            onLeaveReview={(b) => void handleLeaveReview(b)}
            onMoveToWantToTry={(b) => void handleMoveToWantToTry(b)}
            onRemove={(id) => wantToTry.remove(id)}
          />
        ) : null}

        {segment === "favorites" ? (
          <BitesFavoritesSection
            subSegment={favoritesSub}
            onSubSegmentChange={setFavoritesSub}
            restaurantItems={favoritesData.restaurantItems}
            dishItems={favoritesData.dishItems}
            isEmpty={favoritesData.isEmpty}
            isFilterEmpty={favoritesData.isFilterEmpty}
            hasSearch={Boolean(debouncedSearch.trim())}
            onUnfavoriteRestaurant={(id) => void favoritesData.toggleRestaurantFavorite(id)}
            onUnfavoriteDish={(id) => void favoritesData.toggleDishFavorite(id)}
            onOpenJournal={() => setSegment("journal")}
          />
        ) : null}

        {segment === "lists" ? (
          <BitesListsSection
            lists={filteredLists}
            listItems={listItems}
            getRestaurant={getRestaurant}
            isFilterEmpty={userLists.length > 0 && filteredLists.length === 0}
            hasSearch={Boolean(debouncedSearch.trim())}
          />
        ) : null}
      </ScrollView>

      <BitesFiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        segment={segment}
        draft={draftFilters}
        onChange={setDraftFilters}
        onApply={applyFilters}
        onClear={clearFilters}
        cuisineOptions={cuisineOptions}
        cityOptions={cityOptions}
      />

      <BitesSortSheet
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        segment={segment}
        value={getSortForSegment(segment)}
        onSelect={(value) => setSortForSegment(segment, value)}
      />

      <PlanVisitSheet
        visible={Boolean(planTarget)}
        placeName={planTarget?.placeName ?? ""}
        initialDate={
          planTarget?.plannedAt ? planTarget.plannedAt.slice(0, 10) : null
        }
        onClose={() => setPlanTarget(null)}
        onConfirm={(opts) => void confirmPlanVisit(opts)}
      />

      <VisitedFollowUpSheet
        visible={Boolean(visitedFollowUp)}
        placeName={visitedFollowUp?.placeName ?? ""}
        canReview={Boolean(visitedFollowUp?.bookmarkId || visitedFollowUp?.restaurantId)}
        onClose={() => setVisitedFollowUp(null)}
        onAddBite={() => {
          const followUp = visitedFollowUp;
          setVisitedFollowUp(null);
          if (!followUp) return;
          router.push(
            addBiteHref({
              restaurantId: followUp.restaurantId,
              bookmarkId: followUp.bookmarkId,
            }),
          );
        }}
      />
    </SafeAreaView>
  );
}
