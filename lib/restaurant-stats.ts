import type { Follow, Review, User } from "./types";
import { getReviewOverallRating } from "./review-scores";

export type RestaurantRatingsBreakdown = {
  yourRating: number | null;
  friendsAvg: number | null;
  overallAvg: number | null;
  friendCount: number;
  totalReviews: number;
  friendsWhoRated: { user: User; rating: number; reviewId: string }[];
};

export function getRestaurantRatingsBreakdown(
  restaurantId: string,
  currentUserId: string | null,
  reviews: Review[],
  follows: Follow[],
  getUser: (id: string) => User | undefined
): RestaurantRatingsBreakdown {
  const all = reviews.filter(
    (r) => r.restaurantId === restaurantId && r.visibility !== "private",
  );
  const yours = currentUserId
    ? reviews.find((r) => r.restaurantId === restaurantId && r.userId === currentUserId)
    : undefined;
  const friendIds = currentUserId
    ? follows.filter((f) => f.followerId === currentUserId).map((f) => f.followingId)
    : [];
  const friendReviews = all.filter((r) => friendIds.includes(r.userId));
  const friendsAvg = friendReviews.length
    ? friendReviews.reduce((s, r) => s + getReviewOverallRating(r), 0) / friendReviews.length
    : null;
  const overallAvg = all.length ? all.reduce((s, r) => s + getReviewOverallRating(r), 0) / all.length : null;

  const friendsWhoRated = friendReviews
    .map((r) => {
      const user = getUser(r.userId);
      return user ? { user, rating: getReviewOverallRating(r), reviewId: r.id } : null;
    })
    .filter(Boolean) as RestaurantRatingsBreakdown["friendsWhoRated"];

  return {
    yourRating: yours ? getReviewOverallRating(yours) : null,
    friendsAvg,
    overallAvg,
    friendCount: friendReviews.length,
    totalReviews: all.length,
    friendsWhoRated,
  };
}
