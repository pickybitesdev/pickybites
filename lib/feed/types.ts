import type { Cuisine, Dish, PriceLevel, Restaurant, Review, User } from "@/lib/types";

export type FeedItemType =
  | "restaurant_rec"
  | "dish_rec"
  | "friend_review"
  | "taste_match_rec"
  | "prompt"
  | "friend_save";

export type FeedPromptKind =
  | "find_friends"
  | "review_restaurant"
  | "complete_taste_dna"
  | "save_to_bites"
  | "discover_restaurants";

export type FeedBalance = "recommendations" | "friends" | "balanced";

/** Top-level Feed tab: recommendations vs friend activity (kept separate for clarity). */
export type FeedScope = "for_you" | "friends";

export type FeedDistancePref = "nearby" | "5mi" | "10mi" | "any";

export type FeedRestaurantRecItem = {
  id: string;
  type: "restaurant_rec";
  restaurant: Restaurant;
  matchPercent: number;
  reason: string;
  distanceMeters?: number | null;
  communityRating?: number | null;
};

export type FeedDishRecItem = {
  id: string;
  type: "dish_rec";
  dish: Dish;
  restaurant: Restaurant;
  dishScore: number;
  reason: string;
};

export type FeedFriendReviewItem = {
  id: string;
  type: "friend_review";
  review: Review;
  author: User;
  restaurant: Restaurant;
  isOwn: boolean;
  likeCount: number;
  commentCount: number;
  imageUrl: string | null;
};

export type FeedTasteMatchRecItem = {
  id: string;
  type: "taste_match_rec";
  restaurant: Restaurant;
  matchPercent: number;
  reason: string;
  similarUserCount: number;
};

export type FeedPromptItem = {
  id: string;
  type: "prompt";
  kind: FeedPromptKind;
  title: string;
  body: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
};

/** Deferred — bookmarks are private; typed for future opt-in. */
export type FeedFriendSaveItem = {
  id: string;
  type: "friend_save";
  friend: User;
  restaurant: Restaurant;
  listLabel: string;
  matchPercent?: number | null;
};

export type FeedItem =
  | FeedRestaurantRecItem
  | FeedDishRecItem
  | FeedFriendReviewItem
  | FeedTasteMatchRecItem
  | FeedPromptItem
  | FeedFriendSaveItem;

export type FeedMixWeights = {
  personalized: number;
  friendActivity: number;
  discovery: number;
};

export const DEFAULT_FEED_MIX_WEIGHTS: FeedMixWeights = {
  personalized: 0.4,
  friendActivity: 0.4,
  discovery: 0.2,
};

export const FEED_PAGE_SIZE = 12;
export const FEED_NEXT_PAGE_SIZE = 12;
export const FEED_CANDIDATE_CAP = 100;

export function feedItemRestaurantId(item: FeedItem): string | null {
  switch (item.type) {
    case "restaurant_rec":
    case "taste_match_rec":
    case "friend_save":
      return item.restaurant.id;
    case "dish_rec":
      return item.restaurant.id;
    case "friend_review":
      return item.restaurant.id;
    case "prompt":
      return null;
  }
}

export function isPersonalizedType(type: FeedItemType): boolean {
  return type === "restaurant_rec" || type === "dish_rec";
}

export function isFriendActivityType(type: FeedItemType): boolean {
  return type === "friend_review" || type === "friend_save";
}

export function isDiscoveryType(type: FeedItemType): boolean {
  return type === "taste_match_rec" || type === "prompt";
}

/** Miles → meters for feed distance prefs. */
export function feedDistanceMeters(pref: FeedDistancePref): number | null {
  switch (pref) {
    case "nearby":
      return 3219; // ~2 mi
    case "5mi":
      return 8047;
    case "10mi":
      return 16093;
    case "any":
      return null;
  }
}

export type { Cuisine, PriceLevel };
