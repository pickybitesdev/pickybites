import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Pressable,
  Keyboard,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useScrollToTop } from "@react-navigation/native";
import { useAppStore } from "@/store/useAppStore";
import { getDishDiscoveries } from "@/lib/dish-discovery";
import { ui } from "@/constants/ui";
import type { Cuisine } from "@/lib/types";
import {
  DiscoverPlaceSearch,
  type DiscoverPlaceSearchHandle,
} from "@/components/discover/DiscoverPlaceSearch";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "@/components/ui/Tag";
import { useThemedColors } from "@/lib/useThemedColors";
import { getCurrentCoordinates, distanceMeters, getNearLocationLabel } from "@/lib/location";
import {
  searchNearbyRestaurants,
  searchAreaRestaurants,
  getPlacesSearchStatus,
  isPlacesSearchReady,
} from "@/lib/places/google";
import type { ResolvedSearchPlace } from "@/lib/places/autocomplete";
import {
  areaNearLabelFromResolved,
  cameraTargetForResolvedPlace,
  insertSelectedRestaurant,
  isRestaurantSearchResult,
  resolvedPlaceToPlaceResult,
  restaurantToPlaceResult,
  searchRadiusForResolvedPlace,
  type DiscoverCameraTarget,
} from "@/lib/discover-search";
import { enrichPlacesWithYelp, isYelpConfigured, type YelpEnrichment } from "@/lib/places/yelp";
import type { PlaceResult, Coordinates } from "@/lib/places/types";
import { DiscoverMap } from "@/components/maps/DiscoverMap";
import { DISCOVER_TABS, filterRestaurantsForTab, type DiscoverTab } from "@/lib/discover-curated";
import { friendlyError } from "@/lib/errors";
import { hapticSuccess } from "@/lib/haptics";
import { formatDistance } from "@/lib/utils";
import { MAX_DISCOVER_RADIUS_METERS } from "@/lib/places/nearby-search";
import { AddToListSheet } from "@/components/lists/AddToListSheet";
import { DiscoverSectionHeader } from "@/components/discover/DiscoverSectionHeader";
import { DishPickCarousel } from "@/components/discover/DishPickCarousel";
import { DISTANCE_OPTIONS } from "@/components/discover/DiscoverFilterPanel";
import { DiscoverCompactHeader } from "@/components/discover/DiscoverCompactHeader";
import { DiscoverMapListToggle } from "@/components/discover/DiscoverMapListToggle";
import {
  DiscoverFiltersSheet,
  DiscoverFiltersButton,
} from "@/components/discover/DiscoverFiltersSheet";
import { DiscoverResultsTray } from "@/components/discover/DiscoverResultsTray";
import type { DiscoverResultsCarouselHandle } from "@/components/discover/DiscoverResultsCarousel";
import { RestaurantListRow } from "@/components/restaurants/RestaurantListRow";
import { DiscoverPlaceFeedCard } from "@/components/discover/DiscoverPlaceFeedCard";
import { getCommunityRating } from "@/lib/restaurant-tags";
import {
  openRestaurantDirections,
  sharePlacePreview,
  shareRestaurant,
} from "@/lib/share";
import type { MapPin, MapPinType } from "@/lib/maps/pins";
import {
  DEFAULT_DISCOVER_RADIUS,
  DEFAULT_DISCOVER_VIEW_MODE,
  DISCOVER_LIST_SORT_OPTIONS,
  LOCATION_NEEDED_MESSAGE,
  LOCATION_NEEDED_NO_PLACES_MESSAGE,
  PLACES_SIGN_IN_REQUIRED_MESSAGE,
  PLACES_UNAVAILABLE_MESSAGE,
  countActiveDiscoverFilters,
  nearYouSectionLabel,
  pickSurpriseRestaurant,
  sortDiscoverPlaces,
  type DiscoverListSort,
  type DiscoverViewMode,
} from "@/lib/discover-view";
import {
  reconcileSelection,
} from "@/lib/discover-tray";
import { rankAndCapDiscoverPlaces } from "@/lib/discover-results";
import { bookmarkedGooglePlaceIds } from "@/lib/discover-bookmarks";
import { TAB_SCROLL_BOTTOM_PADDING } from "@/lib/tab-bar";
import { loadDiscoverViewMode, saveDiscoverViewMode } from "@/lib/prefs";

function avgRating(reviews: { rating: number }[]) {
  if (!reviews.length) return undefined;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

function placeMatchPercent(place: PlaceResult, favoriteCuisines: string[] | undefined): number | null {
  if (!favoriteCuisines?.length) return null;
  return favoriteCuisines.includes(place.cuisine) ? 84 : 58;
}

export default function DiscoverScreen() {
  const colors = useThemedColors();
  const scrollRef = useRef<ScrollView>(null);
  const carouselRef = useRef<DiscoverResultsCarouselHandle | null>(null);
  const placeSearchRef = useRef<DiscoverPlaceSearchHandle | null>(null);
  const cameraTokenRef = useRef(0);
  useScrollToTop(scrollRef);
  const {
    currentUserId,
    isAuthenticated,
    useSupabase,
    users,
    reviews,
    restaurants,
    dishes,
    refreshFeed,
    isRefreshing,
    ensureRestaurantFromPlace,
    toggleBookmark,
    isBookmarked,
    toggleRestaurantBookmark,
    isRestaurantBookmarked,
    bookmarks,
  } = useAppStore();
  const user = users.find((u) => u.id === currentUserId);
  const userCity = user?.city;

  const [cuisine, setCuisine] = useState<string | null>(null);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [nearby, setNearby] = useState<PlaceResult[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [viewMode, setViewMode] = useState<DiscoverViewMode>(DEFAULT_DISCOVER_VIEW_MODE);
  const [viewModeReady, setViewModeReady] = useState(false);
  const mapMode = viewMode === "map";
  const [radiusMeters, setRadiusMeters] = useState<number>(DEFAULT_DISCOVER_RADIUS);
  const [isAreaSearch, setIsAreaSearch] = useState(false);
  const [addToListTarget, setAddToListTarget] = useState<{ id: string; name: string } | null>(null);
  const [curatedTab, setCuratedTab] = useState<DiscoverTab>("for-you");
  const [mapMounted, setMapMounted] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [listSort, setListSort] = useState<DiscoverListSort>("recommended");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [trayExpanded, setTrayExpanded] = useState(false);
  const [yelpByPlaceId, setYelpByPlaceId] = useState<Record<string, YelpEnrichment>>({});
  const [nearLabel, setNearLabel] = useState<string | null>(null);
  const [cameraTarget, setCameraTarget] = useState<DiscoverCameraTarget | null>(null);
  const [pinnedSearchPlace, setPinnedSearchPlace] = useState<PlaceResult | null>(null);
  const [searchPanelActive, setSearchPanelActive] = useState(false);
  const yelpRequestGen = useRef(0);

  const placesSearchStatus = getPlacesSearchStatus({
    isAuthenticated,
    useRemotePlaces: useSupabase,
  });
  const placesReady = isPlacesSearchReady({
    isAuthenticated,
    useRemotePlaces: useSupabase,
  });
  const listNearLabel = nearYouSectionLabel(nearLabel);

  const communityFeed = useMemo(() => {
    let items = filterRestaurantsForTab(curatedTab, restaurants, reviews, bookmarks, currentUserId, {
      userCoords: coords,
    });
    if (cuisine) items = items.filter((r) => r.cuisine === cuisine);
    return items.slice(0, 10);
  }, [curatedTab, restaurants, reviews, bookmarks, currentUserId, cuisine, coords]);

  const dishPicks =
    currentUserId && curatedTab === "for-you"
      ? getDishDiscoveries(currentUserId, reviews, dishes, restaurants, {
          cuisine: (cuisine as Cuisine) ?? user?.favoriteCuisines[0],
          coords: coords ?? undefined,
          radiusMeters,
          limit: 6,
        })
      : [];

  const loadNearby = useCallback(
    async (opts?: { center?: Coordinates; radius?: number; area?: boolean }) => {
      setLoadingNearby(true);
      try {
        // Always resolve GPS first — Places key is separate from location permission.
        const c = opts?.center ?? coords ?? (await getCurrentCoordinates());
        if (!c) return [] as PlaceResult[];

        setCoords(c);
        if (!isPlacesSearchReady({ isAuthenticated, useRemotePlaces: useSupabase })) {
          return [] as PlaceResult[];
        }

        const radius = Math.min(opts?.radius ?? radiusMeters, MAX_DISCOVER_RADIUS_METERS);
        if (opts?.radius != null) setRadiusMeters(radius);
        setIsAreaSearch(opts?.area ?? false);
        const places = opts?.area
          ? await searchAreaRestaurants(c, radius)
          : await searchNearbyRestaurants(c, radius);
        setNearby(places);
        return places;
      } catch (e) {
        Alert.alert("Location error", friendlyError(e, "Could not load nearby restaurants"));
      } finally {
        setLoadingNearby(false);
      }
      return [] as PlaceResult[];
    },
    [coords, radiusMeters, isAuthenticated, useSupabase],
  );

  const searchMapArea = useCallback(
    async (center: Coordinates, radius: number) => {
      setPinnedSearchPlace(null);
      setCameraTarget(null);
      const places = await loadNearby({ center, radius, area: true });
      setSelectedRestaurantId((prev) =>
        prev && places.some((p) => p.googlePlaceId === prev) ? prev : null,
      );
    },
    [loadNearby],
  );

  const recenterToUser = useCallback(async () => {
    const c = await getCurrentCoordinates();
    if (!c) {
      Alert.alert("Location", "Enable location to find restaurants near you.");
      return;
    }
    setPinnedSearchPlace(null);
    setCameraTarget(null);
    await loadNearby({ center: c, radius: radiusMeters, area: false });
  }, [loadNearby, radiusMeters]);

  const selectDistance = useCallback(
    (meters: number) => {
      const radius = Math.min(meters, MAX_DISCOVER_RADIUS_METERS);
      setIsAreaSearch(false);
      setRadiusMeters(radius);
      loadNearby({ radius, area: false });
    },
    [loadNearby],
  );

  const resetFilters = useCallback(() => {
    setCuisine(null);
    setOpenNowOnly(false);
    setCuratedTab("for-you");
    selectDistance(DEFAULT_DISCOVER_RADIUS);
  }, [selectDistance]);

  const searchWider = useCallback(() => {
    const idx = DISTANCE_OPTIONS.findIndex((o) => o.meters === radiusMeters);
    const next = DISTANCE_OPTIONS[Math.min(idx + 1, DISTANCE_OPTIONS.length - 1)];
    selectDistance(next?.meters ?? MAX_DISCOVER_RADIUS_METERS);
  }, [radiusMeters, selectDistance]);

  useEffect(() => {
    // Request location on launch even if Places isn't configured yet,
    // so the map can open and search/API setup can be fixed separately.
    loadNearby({ radius: DEFAULT_DISCOVER_RADIUS, area: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the user signs in, remote Places becomes usable — refill nearby.
  useEffect(() => {
    if (!placesReady) return;
    if (nearby.length > 0) return;
    void loadNearby({ radius: radiusMeters, area: isAreaSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placesReady]);

  useEffect(() => {
    let cancelled = false;
    loadDiscoverViewMode().then((mode) => {
      if (cancelled) return;
      if (mode) setViewMode(mode);
      setViewModeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!viewModeReady) return;
    void saveDiscoverViewMode(viewMode);
  }, [viewMode, viewModeReady]);

  // Keep the map warm after first mount — don't tear it down on List toggle.
  useEffect(() => {
    if (!mapMode || !coords) return;
    const id = requestAnimationFrame(() => setMapMounted(true));
    return () => cancelAnimationFrame(id);
  }, [mapMode, coords]);

  useEffect(() => {
    let cancelled = false;
    if (!coords) {
      setNearLabel(null);
      return;
    }
    getNearLocationLabel(coords).then((label) => {
      if (!cancelled) setNearLabel(label);
    });
    return () => {
      cancelled = true;
    };
  }, [coords?.latitude, coords?.longitude]);

  const onRefresh = useCallback(async () => {
    await refreshFeed();
    await loadNearby();
  }, [refreshFeed, loadNearby]);

  const openPlace = async (place: PlaceResult) => {
    const result = await ensureRestaurantFromPlace(place);
    if ("error" in result) {
      Alert.alert("Error", result.error);
      return;
    }
    router.push(`/restaurant/${result.id}`);
  };

  const handleSearchNotFound = useCallback(() => {
    Alert.alert("We couldn’t find that place.", undefined, [
      { text: "Try another search" },
      {
        text: "Use current location",
        onPress: () => {
          void recenterToUser();
        },
      },
    ]);
  }, [recenterToUser]);

  const handleResolvedSearchPlace = useCallback(
    async (resolved: ResolvedSearchPlace) => {
      Keyboard.dismiss();
      // Keep the user's current view mode (list stays list after a city/restaurant jump).
      const token = ++cameraTokenRef.current;
      const camera = cameraTargetForResolvedPlace(resolved, token);
      setCameraTarget(camera);

      const areaLabel = areaNearLabelFromResolved(resolved);
      if (areaLabel) setNearLabel(areaLabel);

      const center = { latitude: resolved.latitude, longitude: resolved.longitude };
      const radius = searchRadiusForResolvedPlace(resolved);

      if (isRestaurantSearchResult(resolved)) {
        const place = resolvedPlaceToPlaceResult(resolved);
        setPinnedSearchPlace(place);
        const loaded = await loadNearby({ center, radius, area: true });
        setNearby(insertSelectedRestaurant(loaded, place));
        setSelectedRestaurantId(place.googlePlaceId);
        setTrayExpanded(true);
        requestAnimationFrame(() => {
          carouselRef.current?.scrollToId(place.googlePlaceId, true);
        });
        return;
      }

      // City / neighborhood / address: move camera and fill results quietly.
      setViewMode("map");
      setPinnedSearchPlace(null);
      setSelectedRestaurantId(null);
      setTrayExpanded(false);
      await loadNearby({ center, radius, area: true });
    },
    [loadNearby],
  );

  const handleBookmark = async (place: PlaceResult) => {
    const result = await toggleBookmark(place);
    if (result.ok) hapticSuccess();
    else Alert.alert("Try Next", result.error ?? "Couldn’t save this spot.");
  };

  const handleDirections = useCallback(async (place: PlaceResult) => {
    await openRestaurantDirections({
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
    });
  }, []);

  const handleShare = useCallback(
    async (place: PlaceResult) => {
      const result = await ensureRestaurantFromPlace(place);
      if ("error" in result) {
        await sharePlacePreview(place.name, place.cuisine, place.city, place.address);
        return;
      }
      const community = getCommunityRating(result.id, reviews);
      await shareRestaurant(
        result.id,
        place.name,
        place.cuisine,
        place.city,
        community.avgRating ?? undefined,
      );
    },
    [ensureRestaurantFromPlace, reviews],
  );

  const openAddToList = (restaurantId: string, name: string) => {
    setAddToListTarget({ id: restaurantId, name });
  };

  const handleAddToList = useCallback(
    async (place: PlaceResult) => {
      const result = await ensureRestaurantFromPlace(place);
      if ("error" in result) {
        Alert.alert("Error", result.error);
        return;
      }
      openAddToList(result.id, place.name);
    },
    [ensureRestaurantFromPlace],
  );

  const resolvePinRestaurant = async (id: string, type: MapPinType) => {
    if (type === "rated") return id;
    const place = nearby.find((p) => p.googlePlaceId === id);
    if (!place) return null;
    const result = await ensureRestaurantFromPlace(place);
    return "error" in result ? null : result.id;
  };

  const handleMapPin = async (id: string, type: MapPinType) => {
    if (type === "rated") {
      router.push(`/restaurant/${id}`);
      return;
    }
    const place = nearby.find((p) => p.googlePlaceId === id);
    if (place) await openPlace(place);
  };

  const handleMapBookmark = async (id: string, type: MapPinType) => {
    if (type === "nearby") {
      const place = nearby.find((p) => p.googlePlaceId === id);
      if (place) await handleBookmark(place);
      return;
    }
    const rest = restaurants.find((r) => r.id === id);
    if (rest?.googlePlaceId) {
      const place = nearby.find((p) => p.googlePlaceId === rest.googlePlaceId);
      if (place) await handleBookmark(place);
      return;
    }
    if (rest) {
      const result = await toggleRestaurantBookmark(rest);
      if (result.ok) hapticSuccess();
    }
  };

  const handleMapAddToList = async (id: string, type: MapPinType) => {
    const restaurantId = await resolvePinRestaurant(id, type);
    if (!restaurantId) return;
    const name =
      type === "rated"
        ? (restaurants.find((r) => r.id === id)?.name ?? "Restaurant")
        : (nearby.find((p) => p.googlePlaceId === id)?.name ?? "Restaurant");
    openAddToList(restaurantId, name);
  };

  const nearbyFiltered = useMemo(() => {
    let places = [...nearby];
    if (pinnedSearchPlace) {
      places = insertSelectedRestaurant(places, pinnedSearchPlace);
    }
    if (cuisine) {
      places = places.filter(
        (p) =>
          p.cuisine === cuisine ||
          (pinnedSearchPlace != null && p.googlePlaceId === pinnedSearchPlace.googlePlaceId),
      );
    }
    if (openNowOnly) {
      places = places.filter(
        (p) =>
          p.openNow === true ||
          (pinnedSearchPlace != null && p.googlePlaceId === pinnedSearchPlace.googlePlaceId),
      );
    }
    if (coords) {
      places = places
        .filter(
          (p) =>
            distanceMeters(coords, p) <= radiusMeters * 1.02 ||
            (pinnedSearchPlace != null && p.googlePlaceId === pinnedSearchPlace.googlePlaceId),
        )
        .map((p) => ({ place: p, dist: distanceMeters(coords, p) }))
        .sort((a, b) => a.dist - b.dist)
        .map((x) => x.place);
    }
    return places;
  }, [nearby, cuisine, openNowOnly, coords, radiusMeters, pinnedSearchPlace]);

  const getPlaceRating = useCallback(
    (place: PlaceResult) => {
      const restaurant = restaurants.find((r) => r.googlePlaceId === place.googlePlaceId);
      if (!restaurant) return undefined;
      return avgRating(reviews.filter((r) => r.restaurantId === restaurant.id));
    },
    [restaurants, reviews],
  );

  /** Single ranked+capped array for markers, tray, list, and count labels (max 15). */
  const discoverResults = useMemo(() => {
    const savedIds = bookmarkedGooglePlaceIds(bookmarks);
    const enriched = nearbyFiltered.map((place) => {
      const linked = restaurants.find((r) => r.googlePlaceId === place.googlePlaceId);
      const community = linked ? getCommunityRating(linked.id, reviews) : null;
      return {
        place,
        distanceMeters: coords ? distanceMeters(coords, place) : null,
        rating: community?.avgRating ?? getPlaceRating(place) ?? null,
        matchPercent: placeMatchPercent(place, user?.favoriteCuisines),
        reviewCount: community?.reviewCount,
        isBookmarked: savedIds.has(place.googlePlaceId),
      };
    });
    return rankAndCapDiscoverPlaces(enriched);
  }, [
    nearbyFiltered,
    restaurants,
    reviews,
    coords,
    getPlaceRating,
    user?.favoriteCuisines,
    bookmarks,
  ]);

  const trayPlaces = useMemo(() => discoverResults.map((r) => r.place), [discoverResults]);

  const trayIds = useMemo(() => trayPlaces.map((p) => p.googlePlaceId), [trayPlaces]);

  useEffect(() => {
    setSelectedRestaurantId((prev) => reconcileSelection(prev, trayIds));
  }, [trayIds]);

  // Soft-fail Yelp enrichment for tray places (session-cached in lib/places/yelp).
  useEffect(() => {
    if (!isYelpConfigured() || trayPlaces.length === 0) return;
    const gen = ++yelpRequestGen.current;
    let cancelled = false;
    void (async () => {
      const map = await enrichPlacesWithYelp(trayPlaces, 4);
      if (cancelled || gen !== yelpRequestGen.current) return;
      if (map.size === 0) return;
      setYelpByPlaceId((prev) => {
        const next = { ...prev };
        map.forEach((v, k) => {
          next[k] = v;
        });
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [trayPlaces]);

  const listPlaces = useMemo(() => {
    return sortDiscoverPlaces(discoverResults, listSort);
  }, [discoverResults, listSort]);

  const trayItems = useMemo(
    () =>
      discoverResults.map((item) => {
        const yelp = yelpByPlaceId[item.place.googlePlaceId];
        return {
          place: item.place,
          distanceMeters: item.distanceMeters,
          rating: item.rating,
          matchPercent: item.matchPercent,
          isBookmarked: item.isBookmarked,
          yelpRating: yelp?.rating ?? null,
          yelpReviewCount: yelp?.reviewCount ?? null,
        };
      }),
    [discoverResults, yelpByPlaceId],
  );

  const selectedRadiusLabel =
    DISTANCE_OPTIONS.find((o) => o.meters === radiusMeters)?.label ?? formatDistance(radiusMeters);

  const nearbyStatus = useMemo(() => {
    if (loadingNearby) return "Searching…";
    if (!coords) return "Turn on location to explore nearby.";
    if (discoverResults.length === 0) return "No matches — try a wider radius or different cuisine.";
    return `${discoverResults.length} spot${discoverResults.length === 1 ? "" : "s"} within ${selectedRadiusLabel}`;
  }, [loadingNearby, coords, discoverResults, selectedRadiusLabel]);

  const tabLabel = DISCOVER_TABS.find((t) => t.value === curatedTab)?.label ?? "Discover";
  const savrRestaurants = useMemo(
    () => restaurants.filter((r) => !cuisine || r.cuisine === cuisine),
    [restaurants, cuisine],
  );

  const activeFilterCount = countActiveDiscoverFilters({
    cuisine,
    radiusMeters,
    curatedTab,
    openNowOnly,
    includeCuratedTab: !mapMode,
  });

  const focusCoordinate = useMemo(() => {
    if (!selectedRestaurantId) return null;
    const place = trayPlaces.find((p) => p.googlePlaceId === selectedRestaurantId);
    if (place) return { latitude: place.latitude, longitude: place.longitude };
    return null;
  }, [selectedRestaurantId, trayPlaces]);

  const selectRestaurantId = useCallback((id: string) => {
    // Carousel swipe should follow the pin without overwriting search text or
    // replaying the last search-driven camera jump.
    setCameraTarget(null);
    setSelectedRestaurantId(id);
  }, []);

  const handleSelectPin = useCallback(
    (pin: MapPin | null) => {
      setCameraTarget(null);
      if (!pin) {
        setSelectedRestaurantId(null);
        return;
      }
      let placeId: string | null = null;
      if (pin.type === "nearby") {
        placeId = pin.id;
      } else {
        const rest = restaurants.find((r) => r.id === pin.id);
        placeId = rest?.googlePlaceId ?? null;
        if (placeId && !trayIds.includes(placeId)) {
          // Rated pin outside the current tray — insert it so carousel can sync.
          const asPlace = rest ? restaurantToPlaceResult(rest) : null;
          if (asPlace) {
            setPinnedSearchPlace(asPlace);
            setNearby((prev) => insertSelectedRestaurant(prev, asPlace));
            placeId = asPlace.googlePlaceId;
          } else {
            placeId = null;
          }
        }
      }
      if (placeId) {
        setSelectedRestaurantId(placeId);
        setTrayExpanded(true);
        requestAnimationFrame(() => carouselRef.current?.scrollToId(placeId!, true));
      } else if (pin.type === "rated") {
        // No coords / place id — fall through to restaurant detail via pin press.
        router.push(`/restaurant/${pin.id}`);
      }
    },
    [restaurants, trayIds],
  );

  const surpriseMe = useCallback(async () => {
    let pool = trayPlaces;
    if (!pool.length && placesReady) {
      const loaded = await loadNearby();
      const filtered = cuisine ? loaded.filter((p) => p.cuisine === cuisine) : loaded;
      pool = rankAndCapDiscoverPlaces(
        filtered.map((place) => ({
          place,
          distanceMeters: null,
          rating: null,
          matchPercent: placeMatchPercent(place, user?.favoriteCuisines),
        })),
      ).map((r) => r.place);
    }
    const pick = pickSurpriseRestaurant(pool);
    if (!pick) {
      Alert.alert("Surprise Me", "No restaurants nearby yet — try Search this area or widen filters.");
      return;
    }
    setViewMode("map");
    setSelectedRestaurantId(pick.googlePlaceId);
    setTrayExpanded(true);
    requestAnimationFrame(() => carouselRef.current?.scrollToId(pick.googlePlaceId, true));
  }, [trayPlaces, loadNearby, cuisine, user?.favoriteCuisines, placesReady]);

  const showCommunity = !mapMode && curatedTab !== "for-you" && communityFeed.length > 0;
  const showNearYou = placesReady;

  const headerChrome = (
    <View className="px-4 pt-2 pb-2 gap-2" style={{ zIndex: 30, elevation: 30 }}>
      <DiscoverCompactHeader onSurpriseMe={surpriseMe} surpriseDisabled={loadingNearby} />
      {nearLabel ? (
        <Pressable
          onPress={() => placeSearchRef.current?.focus()}
          accessibilityRole="button"
          accessibilityLabel={`${nearLabel}. Focus search`}
          hitSlop={6}
          testID="discover-near-label"
        >
          <Text className={`text-[12px] font-medium ${ui.text.secondary}`} numberOfLines={1}>
            {nearLabel}
          </Text>
        </Pressable>
      ) : null}
      {/* Search + Filters share one fixed row so Filters never drifts beside the Near label. */}
      <View className="flex-row items-center gap-2" style={{ zIndex: 31 }}>
        <View className="flex-1 min-w-0" style={{ zIndex: 32 }}>
          <DiscoverPlaceSearch
            ref={placeSearchRef}
            coords={coords}
            searchStatus={placesSearchStatus}
            onResolvedPlace={(place) => {
              void handleResolvedSearchPlace(place);
            }}
            onNotFound={handleSearchNotFound}
            onActiveChange={setSearchPanelActive}
            placeholder="Search city, neighborhood, or restaurant"
          />
        </View>
        <DiscoverFiltersButton count={activeFilterCount} onPress={() => setFilterSheetOpen(true)} />
      </View>
    </View>
  );

  const listFloatingToggle = (
    <View
      className="absolute left-0 right-0 items-center z-10"
      style={{ bottom: TAB_SCROLL_BOTTOM_PADDING - 8 }}
      pointerEvents="box-none"
    >
      <DiscoverMapListToggle mode={viewMode} onChange={setViewMode} />
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${ui.screen}`} edges={["top"]}>
      <AddToListSheet
        visible={addToListTarget != null}
        restaurantId={addToListTarget?.id ?? ""}
        restaurantName={addToListTarget?.name ?? ""}
        onClose={() => setAddToListTarget(null)}
      />

      <DiscoverFiltersSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        curatedTab={curatedTab}
        onTabChange={setCuratedTab}
        cuisine={cuisine}
        onCuisineChange={setCuisine}
        radiusMeters={radiusMeters}
        onRadiusChange={selectDistance}
        showDistance={placesReady}
        showBrowseTabs={!mapMode}
        openNowOnly={openNowOnly}
        onOpenNowOnlyChange={setOpenNowOnly}
        onReset={resetFilters}
      />

      {headerChrome}

      <View className="flex-1 relative">
        {/* Keep map mounted once warmed so Map ↔ List doesn't cold-start pins. */}
        <View
          style={{ flex: 1, display: mapMode ? "flex" : "none" }}
          pointerEvents={mapMode ? "auto" : "none"}
          collapsable={false}
        >
          {loadingNearby && !coords ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={colors.spinner} size="large" />
              <Text className={`mt-3 ${ui.text.muted}`}>Loading map…</Text>
            </View>
          ) : coords && mapMounted ? (
            <DiscoverMap
              fullScreen
              coords={coords}
              restaurants={savrRestaurants}
              nearbyPlaces={trayPlaces}
              searching={loadingNearby}
              onSearchArea={searchMapArea}
              onRecenterUser={recenterToUser}
              onPinPress={handleMapPin}
              onBookmarkPin={handleMapBookmark}
              onAddToListPin={handleMapAddToList}
              isPinBookmarked={(id, type) =>
                type === "nearby"
                  ? isBookmarked(id)
                  : (() => {
                      const r = restaurants.find((x) => x.id === id);
                      return r ? isRestaurantBookmarked(r) : false;
                    })()
              }
              showPinSheet={false}
              onSelectPin={handleSelectPin}
              selectedPinId={selectedRestaurantId}
              focusCoordinate={cameraTarget ? null : focusCoordinate}
              cameraTarget={cameraTarget}
              onMapPress={() => {
                Keyboard.dismiss();
                placeSearchRef.current?.dismissSuggestions();
              }}
              hideSearchArea={searchPanelActive}
            />
          ) : coords && !mapMounted ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={colors.spinner} size="large" />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <EmptyState
                icon="location-outline"
                title="Location needed"
                description={
                  placesReady
                    ? LOCATION_NEEDED_MESSAGE
                    : placesSearchStatus === "sign_in"
                      ? `${LOCATION_NEEDED_MESSAGE} ${PLACES_SIGN_IN_REQUIRED_MESSAGE}`
                      : LOCATION_NEEDED_NO_PLACES_MESSAGE
                }
                actionLabel="Open Settings"
                onAction={() => {
                  void Linking.openSettings();
                }}
                secondaryActionLabel="Try Again"
                onSecondaryAction={() => loadNearby()}
              />
            </View>
          )}

          {mapMode ? (
            <DiscoverResultsTray
              resultCount={discoverResults.length}
              items={trayItems}
              selectedId={selectedRestaurantId}
              coords={coords}
              expanded={trayExpanded}
              onExpandedChange={setTrayExpanded}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSelectId={selectRestaurantId}
              onOpen={openPlace}
              onBookmark={handleBookmark}
              onShare={handleShare}
              onDirections={handleDirections}
              onAddToList={handleAddToList}
              onClearFilters={resetFilters}
              onSearchWider={searchWider}
              carouselRef={carouselRef}
            />
          ) : null}
        </View>

        {!mapMode ? (
          <View className="flex-1 relative">
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerClassName="pb-36"
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.spinner} />
              }
            >
              <View className="px-4 gap-6 pt-2">
                <View className="gap-2">
                  <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>Sort</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                    {DISCOVER_LIST_SORT_OPTIONS.map((opt) => (
                      <Tag
                        key={opt.value}
                        label={opt.label}
                        active={listSort === opt.value}
                        onPress={() => setListSort(opt.value)}
                      />
                    ))}
                  </ScrollView>
                </View>

                {showNearYou && (
                  <View className="gap-3">
                    <DiscoverSectionHeader
                      icon={isAreaSearch ? "map" : "location"}
                      iconColor={colors.brand}
                      title={listNearLabel}
                      subtitle={nearbyStatus}
                      onAction={() => loadNearby()}
                    />
                    {loadingNearby && listPlaces.length === 0 ? (
                      <ActivityIndicator color={colors.spinner} className="py-8" />
                    ) : listPlaces.length > 0 ? (
                      <View className="gap-4">
                        {loadingNearby ? (
                          <ActivityIndicator color={colors.spinner} className="py-1" />
                        ) : null}
                        {listPlaces.map(
                          ({ place, distanceMeters: dist, rating, matchPercent }) => {
                            const yelp = yelpByPlaceId[place.googlePlaceId];
                            return (
                              <DiscoverPlaceFeedCard
                                key={place.googlePlaceId}
                                place={place}
                                distanceMeters={dist}
                                rating={rating}
                                matchPercent={matchPercent}
                                yelpRating={yelp?.rating ?? null}
                                yelpReviewCount={yelp?.reviewCount ?? null}
                                sectionLabel={listNearLabel}
                                onPress={() => openPlace(place)}
                                isBookmarked={isBookmarked(place.googlePlaceId)}
                                onBookmark={() => handleBookmark(place)}
                              />
                            );
                          },
                        )}
                      </View>
                    ) : (
                      <EmptyState
                        icon="search-outline"
                        title="No spots found"
                        description="Widen the distance or clear the cuisine filter."
                        actionLabel="Reset filters"
                        onAction={resetFilters}
                      />
                    )}
                  </View>
                )}

                {showCommunity && (
                  <View className="gap-3">
                    <DiscoverSectionHeader
                      icon="people"
                      iconColor={colors.brand}
                      title={tabLabel}
                      subtitle={`Community picks${userCity ? ` · ${userCity}` : ""}`}
                    />
                    <View className="gap-2">
                      {communityFeed.map((r) => (
                        <RestaurantListRow
                          key={r.id}
                          restaurant={r}
                          reviews={reviews}
                          onPress={() => router.push(`/restaurant/${r.id}`)}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {curatedTab === "for-you" && communityFeed.length > 0 && (
                  <View className="gap-3">
                    <DiscoverSectionHeader
                      icon="bookmark"
                      iconColor={colors.brand}
                      title="On your radar"
                      subtitle="Saved or not yet reviewed"
                    />
                    <View className="gap-2">
                      {communityFeed.slice(0, 6).map((r) => (
                        <RestaurantListRow
                          key={r.id}
                          restaurant={r}
                          reviews={reviews}
                          onPress={() => router.push(`/restaurant/${r.id}`)}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {curatedTab === "for-you" && dishPicks.length > 0 && (
                  <View className="gap-3">
                    <DiscoverSectionHeader
                      icon="restaurant"
                      iconColor={colors.brand}
                      title="Best dishes near you"
                      subtitle="From your taste profile"
                    />
                    <DishPickCarousel picks={dishPicks} />
                  </View>
                )}

                {!placesReady && communityFeed.length === 0 && (
                  <EmptyState
                    icon="search-outline"
                    title="Search unavailable"
                    description={
                      placesSearchStatus === "sign_in"
                        ? PLACES_SIGN_IN_REQUIRED_MESSAGE
                        : PLACES_UNAVAILABLE_MESSAGE
                    }
                  />
                )}

                {curatedTab !== "for-you" && communityFeed.length === 0 && !loadingNearby && (
                  <EmptyState
                    icon="restaurant-outline"
                    title={`No ${tabLabel.toLowerCase()} spots yet`}
                    description="Try another category or add more reviews to grow the community feed."
                    actionLabel="Browse For You"
                    onAction={() => setCuratedTab("for-you")}
                  />
                )}
              </View>
            </ScrollView>
            {listFloatingToggle}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
