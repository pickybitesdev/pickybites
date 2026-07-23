import { useMemo, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getBucketListStats, getBucketListSections } from "@/lib/bucket-list";
import type { PlaceResult } from "@/lib/places/types";
import type { BucketListStatus, Restaurant } from "@/lib/types";

export function useSavedRestaurants() {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const isDataLoaded = useAppStore((s) => s.isDataLoaded);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const toggleRestaurantBookmark = useAppStore((s) => s.toggleRestaurantBookmark);
  const isBookmarked = useAppStore((s) => s.isBookmarked);
  const isRestaurantBookmarked = useAppStore((s) => s.isRestaurantBookmarked);
  const removeBookmark = useAppStore((s) => s.removeBookmark);
  const updateBookmarkStatus = useAppStore((s) => s.updateBookmarkStatus);

  const saved = useMemo(
    () =>
      bookmarks
        .filter((b) => b.userId === currentUserId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [bookmarks, currentUserId],
  );

  const stats = useMemo(() => getBucketListStats(saved), [saved]);
  const sections = useMemo(() => getBucketListSections(saved), [saved]);

  const savePlace = useCallback(
    (place: PlaceResult) => toggleBookmark(place),
    [toggleBookmark],
  );

  const saveRestaurant = useCallback(
    (restaurant: Restaurant) => toggleRestaurantBookmark(restaurant),
    [toggleRestaurantBookmark],
  );

  const updateStatus = useCallback(
    (
      bookmarkId: string,
      status: BucketListStatus,
      opts?: { plannedAt?: string; visitedAt?: string; restaurantId?: string | null },
    ) => updateBookmarkStatus(bookmarkId, status, opts),
    [updateBookmarkStatus],
  );

  return {
    saved,
    stats,
    sections,
    count: saved.length,
    isLoading: !isDataLoaded,
    isEmpty: saved.length === 0,
    emptyMessage: "Save restaurants to your food bucket list.",
    savePlace,
    saveRestaurant,
    remove: removeBookmark,
    updateStatus,
    isPlaceSaved: isBookmarked,
    isRestaurantSaved: isRestaurantBookmarked,
  };
}
