import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Cuisine } from "@/lib/types";

export type FeedDismissals = {
  restaurantIds: string[];
  mutedUserIds: string[];
  fewerCuisines: Cuisine[];
  hiddenReviewIds: string[];
};

export const EMPTY_FEED_DISMISSALS: FeedDismissals = {
  restaurantIds: [],
  mutedUserIds: [],
  fewerCuisines: [],
  hiddenReviewIds: [],
};

const key = (userId: string) => `@pickybites/feed_dismissals/${userId}`;

export async function loadFeedDismissals(userId: string): Promise<FeedDismissals> {
  const raw = await AsyncStorage.getItem(key(userId));
  if (!raw) return { ...EMPTY_FEED_DISMISSALS, restaurantIds: [], mutedUserIds: [], fewerCuisines: [], hiddenReviewIds: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<FeedDismissals>;
    return {
      restaurantIds: parsed.restaurantIds ?? [],
      mutedUserIds: parsed.mutedUserIds ?? [],
      fewerCuisines: parsed.fewerCuisines ?? [],
      hiddenReviewIds: parsed.hiddenReviewIds ?? [],
    };
  } catch {
    return { ...EMPTY_FEED_DISMISSALS, restaurantIds: [], mutedUserIds: [], fewerCuisines: [], hiddenReviewIds: [] };
  }
}

export async function saveFeedDismissals(userId: string, dismissals: FeedDismissals): Promise<void> {
  await AsyncStorage.setItem(key(userId), JSON.stringify(dismissals));
}

export function dismissRestaurant(dismissals: FeedDismissals, restaurantId: string): FeedDismissals {
  if (dismissals.restaurantIds.includes(restaurantId)) return dismissals;
  return { ...dismissals, restaurantIds: [...dismissals.restaurantIds, restaurantId] };
}

export function hideReview(dismissals: FeedDismissals, reviewId: string): FeedDismissals {
  if (dismissals.hiddenReviewIds.includes(reviewId)) return dismissals;
  return { ...dismissals, hiddenReviewIds: [...dismissals.hiddenReviewIds, reviewId] };
}

export function muteUser(dismissals: FeedDismissals, userId: string): FeedDismissals {
  if (dismissals.mutedUserIds.includes(userId)) return dismissals;
  return { ...dismissals, mutedUserIds: [...dismissals.mutedUserIds, userId] };
}

export function fewerLikeCuisine(dismissals: FeedDismissals, cuisine: Cuisine): FeedDismissals {
  if (dismissals.fewerCuisines.includes(cuisine)) return dismissals;
  return { ...dismissals, fewerCuisines: [...dismissals.fewerCuisines, cuisine] };
}
