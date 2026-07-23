import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getCurrentCoordinates } from "@/lib/location";
import type { Coordinates } from "@/lib/places/types";
import { loadTastePreferences, type TastePreferences } from "@/lib/taste-preferences";
import {
  DEFAULT_FEED_PREFERENCES,
  hasActiveFeedFilters,
  loadFeedPreferences,
  resetFeedPreferences,
  saveFeedPreferences,
  type FeedPreferences,
} from "@/lib/feed-preferences";
import {
  EMPTY_FEED_DISMISSALS,
  dismissRestaurant,
  fewerLikeCuisine,
  hideReview,
  loadFeedDismissals,
  muteUser,
  saveFeedDismissals,
  type FeedDismissals,
} from "@/lib/feed-dismissals";
import { buildMixedFeed } from "@/lib/feed/build-candidates";
import { filterFeedByScope } from "@/lib/feed/filter";
import {
  createFeedPageState,
  loadMoreFeedItems,
  resetFeedPage,
  type FeedPageState,
} from "@/lib/feed/pagination";
import type { FeedItem, FeedScope } from "@/lib/feed/types";
import type { Cuisine } from "@/lib/types";

export function useFeed() {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const users = useAppStore((s) => s.users);
  const reviews = useAppStore((s) => s.reviews);
  const restaurants = useAppStore((s) => s.restaurants);
  const dishes = useAppStore((s) => s.dishes);
  const follows = useAppStore((s) => s.follows);
  const reviewPhotos = useAppStore((s) => s.reviewPhotos);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const isDataLoaded = useAppStore((s) => s.isDataLoaded);
  const isRefreshing = useAppStore((s) => s.isRefreshing);
  const refreshFeed = useAppStore((s) => s.refreshFeed);
  const toggleRestaurantBookmark = useAppStore((s) => s.toggleRestaurantBookmark);
  const deleteReview = useAppStore((s) => s.deleteReview);
  const toggleFollow = useAppStore((s) => s.toggleFollow);

  const user = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId],
  );

  const followingCount = useMemo(
    () => follows.filter((f) => f.followerId === currentUserId).length,
    [follows, currentUserId],
  );

  const [prefs, setPrefs] = useState<FeedPreferences>(DEFAULT_FEED_PREFERENCES);
  const [dismissals, setDismissals] = useState<FeedDismissals>({
    ...EMPTY_FEED_DISMISSALS,
    restaurantIds: [],
    mutedUserIds: [],
    fewerCuisines: [],
    hiddenReviewIds: [],
  });
  const [tastePrefs, setTastePrefs] = useState<TastePreferences | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [sessionKey, setSessionKey] = useState(() => String(Date.now()));
  const [fullSession, setFullSession] = useState<FeedItem[]>([]);
  const [scope] = useState<FeedScope>("friends");
  const setScope = useCallback((_next: FeedScope) => {
    /* Feed is friends-only — scope toggle removed. */
  }, []);
  const [page, setPage] = useState<FeedPageState>(() => createFeedPageState([]));
  const [error, setError] = useState<string | null>(null);
  const [prefsReady, setPrefsReady] = useState(false);

  const storeRef = useRef({
    user,
    users,
    reviews,
    restaurants,
    dishes,
    follows,
    reviewPhotos,
    bookmarks,
    tastePrefs,
    coords,
  });
  storeRef.current = {
    user,
    users,
    reviews,
    restaurants,
    dishes,
    follows,
    reviewPhotos,
    bookmarks,
    tastePrefs,
    coords,
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!currentUserId) {
        setPrefsReady(true);
        return;
      }
      const [fp, fd, tp] = await Promise.all([
        loadFeedPreferences(currentUserId),
        loadFeedDismissals(currentUserId),
        loadTastePreferences(currentUserId),
      ]);
      if (cancelled) return;
      setPrefs(fp);
      setDismissals(fd);
      setTastePrefs(tp);
      setPrefsReady(true);
      try {
        const c = await getCurrentCoordinates();
        if (!cancelled) setCoords(c);
      } catch {
        // location optional
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const rebuildSession = useCallback(
    (
      nextPrefs: FeedPreferences,
      nextDismissals: FeedDismissals,
      nextSession: string,
    ) => {
      if (!currentUserId) {
        setFullSession([]);
        setPage(createFeedPageState([]));
        return;
      }
      try {
        const s = storeRef.current;
        const live = useAppStore.getState();
        const sessionItems = buildMixedFeed({
          userId: currentUserId,
          user: s.user,
          users: s.users,
          reviews: s.reviews,
          restaurants: s.restaurants,
          dishes: s.dishes,
          follows: s.follows,
          likes: live.likes,
          comments: live.comments,
          reviewPhotos: s.reviewPhotos,
          bookmarks: s.bookmarks,
          prefs: nextPrefs,
          dismissals: nextDismissals,
          tastePrefs: s.tastePrefs,
          coords: s.coords,
          sessionKey: nextSession,
        });
        setFullSession(sessionItems);
        setError(null);
      } catch {
        setError("We couldn’t refresh your Feed.");
      }
    },
    [currentUserId],
  );

  // Scope keeps For You and Friends as separate lists (not interleaved).
  useEffect(() => {
    setPage(resetFeedPage(filterFeedByScope(fullSession, scope)));
  }, [fullSession, scope]);

  useEffect(() => {
    if (!prefsReady || !isDataLoaded || !currentUserId) return;
    rebuildSession(prefs, dismissals, sessionKey);
    // Intentionally omit likes/comments — card UIs read those live from the store.
    // Including them rebuilds the session and resets scroll on every like/comment.
  }, [
    prefsReady,
    isDataLoaded,
    currentUserId,
    reviews,
    restaurants,
    follows,
    dishes,
    bookmarks,
    prefs,
    dismissals,
    coords,
    sessionKey,
    rebuildSession,
  ]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await refreshFeed();
      const nextSession = String(Date.now());
      setSessionKey(nextSession);
      rebuildSession(prefs, dismissals, nextSession);
    } catch {
      setError("We couldn’t refresh your Feed.");
    }
  }, [refreshFeed, rebuildSession, prefs, dismissals]);

  const loadMore = useCallback(() => {
    setPage((prev) => loadMoreFeedItems(prev));
  }, []);

  const applyPreferences = useCallback(
    async (next: FeedPreferences) => {
      if (!currentUserId) return;
      setPrefs(next);
      await saveFeedPreferences(currentUserId, next);
      const nextSession = String(Date.now());
      setSessionKey(nextSession);
      rebuildSession(next, dismissals, nextSession);
    },
    [currentUserId, dismissals, rebuildSession],
  );

  const resetPreferences = useCallback(async () => {
    await applyPreferences(resetFeedPreferences());
  }, [applyPreferences]);

  const persistDismissals = useCallback(
    async (next: FeedDismissals) => {
      setDismissals(next);
      if (currentUserId) await saveFeedDismissals(currentUserId, next);
      rebuildSession(prefs, next, sessionKey);
    },
    [currentUserId, prefs, sessionKey, rebuildSession],
  );

  const hideRestaurant = useCallback(
    async (restaurantId: string) => {
      await persistDismissals(dismissRestaurant(dismissals, restaurantId));
    },
    [dismissals, persistDismissals],
  );

  const showFewerLikeCuisine = useCallback(
    async (cuisine: Cuisine) => {
      await persistDismissals(fewerLikeCuisine(dismissals, cuisine));
    },
    [dismissals, persistDismissals],
  );

  const hidePost = useCallback(
    async (reviewId: string) => {
      await persistDismissals(hideReview(dismissals, reviewId));
    },
    [dismissals, persistDismissals],
  );

  const showFewerFromUser = useCallback(
    async (userId: string) => {
      await persistDismissals(muteUser(dismissals, userId));
    },
    [dismissals, persistDismissals],
  );

  const unfollowUser = useCallback(
    async (userId: string) => {
      await toggleFollow(userId);
      await showFewerFromUser(userId);
    },
    [toggleFollow, showFewerFromUser],
  );

  const emptyKind = useMemo(() => {
    if (page.visible.length > 0) return null;
    if (!isDataLoaded || !prefsReady) return null;
    if (error) return "error" as const;
    if (hasActiveFeedFilters(prefs)) return "filtered" as const;
    if (scope === "friends") return "friends" as const;
    return "empty" as const;
  }, [page.visible.length, isDataLoaded, prefsReady, error, prefs, scope]);

  const isBookmarked = useCallback(
    (restaurantId: string) =>
      bookmarks.some(
        (b) =>
          b.userId === currentUserId &&
          (b.restaurantId === restaurantId ||
            (b.googlePlaceId &&
              restaurants.find((r) => r.id === restaurantId)?.googlePlaceId === b.googlePlaceId)),
      ),
    [bookmarks, currentUserId, restaurants],
  );

  return {
    items: page.visible as FeedItem[],
    hasMore: page.hasMore,
    isLoading: !isDataLoaded || !prefsReady,
    isRefreshing,
    error,
    emptyKind,
    prefs,
    scope,
    setScope,
    followingCount,
    user,
    refresh,
    loadMore,
    applyPreferences,
    resetPreferences,
    hideRestaurant,
    showFewerLikeCuisine,
    hidePost,
    showFewerFromUser,
    unfollowUser,
    toggleRestaurantBookmark,
    deleteReview,
    isBookmarked,
    locationAvailable: coords != null,
    whyReason: (item: FeedItem) => {
      if (item.type === "restaurant_rec" || item.type === "taste_match_rec" || item.type === "dish_rec") {
        return item.reason;
      }
      return "Based on people you follow and your taste profile.";
    },
  };
}
