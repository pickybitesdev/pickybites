import { getReviewOverallRating } from "@/lib/review-scores";
import { calculateTasteMatch } from "@/lib/taste-match";
import type { Restaurant, Review, User } from "@/lib/types";
import type {
  FeedDishRecItem,
  FeedFriendReviewItem,
  FeedRestaurantRecItem,
  FeedTasteMatchRecItem,
} from "@/lib/feed/types";

export function rankRestaurantRecs(items: FeedRestaurantRecItem[]): FeedRestaurantRecItem[] {
  return [...items].sort((a, b) => b.matchPercent - a.matchPercent);
}

export function rankDishRecs(items: FeedDishRecItem[]): FeedDishRecItem[] {
  return [...items].sort((a, b) => b.dishScore - a.dishScore);
}

/**
 * Friend reviews: recency, taste match with author, engagement, geographic relevance (distance optional).
 */
export function rankFriendReviews(
  items: FeedFriendReviewItem[],
  currentUserId: string,
  reviews: Review[],
  restaurants: Restaurant[],
): FeedFriendReviewItem[] {
  return [...items]
    .map((item) => {
      const recency = new Date(item.review.createdAt).getTime();
      const match = item.isOwn
        ? 50
        : calculateTasteMatch(currentUserId, item.author.id, reviews, restaurants);
      const engagement = item.likeCount * 2 + item.commentCount * 3;
      const ratingBoost = getReviewOverallRating(item.review);
      const score = recency / 1e11 + match * 0.4 + engagement * 0.8 + ratingBoost * 0.5;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}

/** Order friend reviews by Customize Feed sort preference. */
export function orderFriendReviews(
  items: FeedFriendReviewItem[],
  sort: "newest" | "best_match",
  currentUserId: string,
  reviews: Review[],
  restaurants: Restaurant[],
): FeedFriendReviewItem[] {
  if (sort === "best_match") {
    return rankFriendReviews(items, currentUserId, reviews, restaurants);
  }
  return [...items].sort(
    (a, b) => new Date(b.review.createdAt).getTime() - new Date(a.review.createdAt).getTime(),
  );
}

export function rankTasteMatchRecs(items: FeedTasteMatchRecItem[]): FeedTasteMatchRecItem[] {
  return [...items].sort(
    (a, b) => b.matchPercent - a.matchPercent || b.similarUserCount - a.similarUserCount,
  );
}

/** Build taste-match restaurant candidates from high ratings by similar users. */
export function buildTasteMatchCandidates(
  currentUserId: string,
  users: User[],
  reviews: Review[],
  restaurants: Restaurant[],
  reviewedIds: Set<string>,
  limit = 15,
): FeedTasteMatchRecItem[] {
  const rMap = new Map(restaurants.map((r) => [r.id, r]));
  const similar = users
    .filter((u) => u.id !== currentUserId)
    .map((u) => ({
      user: u,
      match: calculateTasteMatch(currentUserId, u.id, reviews, restaurants),
    }))
    .filter((x) => x.match >= 55)
    .sort((a, b) => b.match - a.match)
    .slice(0, 12);

  if (!similar.length) return [];

  const similarIds = new Set(similar.map((s) => s.user.id));
  const byRestaurant = new Map<string, { count: number; matchSum: number }>();

  reviews.forEach((rev) => {
    if (!similarIds.has(rev.userId)) return;
    if (getReviewOverallRating(rev) < 8) return;
    if (reviewedIds.has(rev.restaurantId)) return;
    const entry = byRestaurant.get(rev.restaurantId) ?? { count: 0, matchSum: 0 };
    const m = similar.find((s) => s.user.id === rev.userId)?.match ?? 55;
    entry.count += 1;
    entry.matchSum += m;
    byRestaurant.set(rev.restaurantId, entry);
  });

  return [...byRestaurant.entries()]
    .map(([restaurantId, { count, matchSum }]) => {
      const restaurant = rMap.get(restaurantId);
      if (!restaurant) return null;
      const matchPercent = Math.min(95, Math.round(matchSum / count));
      return {
        id: `tm:${restaurantId}`,
        type: "taste_match_rec" as const,
        restaurant,
        matchPercent,
        reason: `People with similar taste loved this`,
        similarUserCount: count,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.matchPercent - a!.matchPercent || b!.similarUserCount - a!.similarUserCount)
    .slice(0, limit) as FeedTasteMatchRecItem[];
}
