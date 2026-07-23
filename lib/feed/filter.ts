import { distanceMeters } from "@/lib/location";
import type { Coordinates } from "@/lib/places/types";
import type { FeedDismissals } from "@/lib/feed-dismissals";
import type { FeedPreferences } from "@/lib/feed-preferences";
import {
  feedDistanceMeters,
  feedItemRestaurantId,
  isDiscoveryType,
  isFriendActivityType,
  isPersonalizedType,
  type FeedItem,
  type FeedScope,
} from "@/lib/feed/types";

/** Split For You vs Friends so the Feed never interleaves the two. */
export function filterFeedByScope(items: FeedItem[], scope: FeedScope): FeedItem[] {
  if (scope === "for_you") {
    return items.filter(
      (item) =>
        isPersonalizedType(item.type) ||
        isDiscoveryType(item.type) ||
        item.type === "prompt",
    );
  }
  return items.filter((item) => isFriendActivityType(item.type));
}

/**
 * Apply Customize Feed prefs + dismissals. Never emits friend_save
 * while bookmarks remain private (showFriendSaves forced off).
 */
export function filterFeedItems(
  items: FeedItem[],
  prefs: FeedPreferences,
  dismissals: FeedDismissals,
  coords: Coordinates | null = null,
): FeedItem[] {
  const maxDist = feedDistanceMeters(prefs.distance);
  const priceSet = prefs.priceLevels.length ? new Set(prefs.priceLevels) : null;
  const cuisineSet = prefs.cuisineOverrides.length ? new Set(prefs.cuisineOverrides) : null;
  const dismissedRestaurants = new Set(dismissals.restaurantIds);
  const mutedUsers = new Set(dismissals.mutedUserIds);
  const hiddenReviews = new Set(dismissals.hiddenReviewIds);
  const fewerCuisines = new Set(dismissals.fewerCuisines);

  return items.filter((item) => {
    if (item.type === "friend_save") return false;

    if (item.type === "dish_rec" && !prefs.showDishRecs) return false;

    if (item.type === "friend_review") {
      if (mutedUsers.has(item.author.id)) return false;
      if (hiddenReviews.has(item.review.id)) return false;
    }

    const restaurantId = feedItemRestaurantId(item);
    if (restaurantId && dismissedRestaurants.has(restaurantId)) return false;

    const restaurant =
      item.type === "restaurant_rec" ||
      item.type === "taste_match_rec" ||
      item.type === "dish_rec" ||
      item.type === "friend_review"
        ? item.restaurant
        : null;

    if (restaurant) {
      if (fewerCuisines.has(restaurant.cuisine) && item.type !== "friend_review") {
        return false;
      }
      if (cuisineSet && !cuisineSet.has(restaurant.cuisine)) {
        if (
          item.type === "restaurant_rec" ||
          item.type === "dish_rec" ||
          item.type === "taste_match_rec" ||
          item.type === "friend_review"
        ) {
          return false;
        }
      }
      if (priceSet && !priceSet.has(restaurant.priceLevel)) {
        if (
          item.type === "restaurant_rec" ||
          item.type === "dish_rec" ||
          item.type === "taste_match_rec" ||
          item.type === "friend_review"
        ) {
          return false;
        }
      }
      if (prefs.hiddenGems && restaurant.priceLevel > 2 && item.type !== "friend_review") {
        if (item.type === "restaurant_rec" || item.type === "taste_match_rec") return false;
      }
      if (
        prefs.dateNight &&
        restaurant.priceLevel < 3 &&
        (item.type === "restaurant_rec" || item.type === "taste_match_rec")
      ) {
        return false;
      }
      if (maxDist != null && coords && restaurant.latitude != null && restaurant.longitude != null) {
        const d = distanceMeters(coords, {
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
        });
        if (d > maxDist) return false;
      }
    }

    return true;
  });
}

/** Drop duplicate IDs and repeat restaurants within a window. */
export function dedupeFeedItems(items: FeedItem[], restaurantWindow = 6): FeedItem[] {
  const seenIds = new Set<string>();
  const recentRestaurants: string[] = [];
  const out: FeedItem[] = [];

  for (const item of items) {
    if (seenIds.has(item.id)) continue;
    const rid = feedItemRestaurantId(item);
    if (rid && recentRestaurants.includes(rid)) continue;

    seenIds.add(item.id);
    out.push(item);
    if (rid) {
      recentRestaurants.push(rid);
      if (recentRestaurants.length > restaurantWindow) recentRestaurants.shift();
    }
  }
  return out;
}
