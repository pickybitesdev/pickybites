import type { Review, ReviewVisibility } from "@/lib/types";
import { getNormalizedRating } from "@/lib/review-scores";

export type PickyBitesCommunityScore = {
  averageNormalized: number;
  reviewCount: number;
  weightedScore: number;
};

const DEFAULT_PRIOR_MEAN = 70;
const DEFAULT_PRIOR_WEIGHT = 5;

export function isScoreEligibleVisibility(visibility: ReviewVisibility | undefined): boolean {
  return visibility !== "private";
}

/**
 * Bayesian community score on 0–100 normalized ratings.
 * Never averages raw rating_value across different maxes.
 */
export function getPickyBitesScore(
  restaurantId: string,
  reviews: Review[],
  priorMean = DEFAULT_PRIOR_MEAN,
  priorWeight = DEFAULT_PRIOR_WEIGHT,
): PickyBitesCommunityScore {
  const eligible = reviews.filter(
    (r) => r.restaurantId === restaurantId && isScoreEligibleVisibility(r.visibility),
  );
  if (!eligible.length) {
    return { averageNormalized: 0, reviewCount: 0, weightedScore: priorMean };
  }
  const averageNormalized =
    eligible.reduce((s, r) => s + getNormalizedRating(r), 0) / eligible.length;
  const reviewCount = eligible.length;
  const weightedScore =
    (averageNormalized * reviewCount + priorMean * priorWeight) / (reviewCount + priorWeight);
  return {
    averageNormalized: Math.round(averageNormalized * 100) / 100,
    reviewCount,
    weightedScore: Math.round(weightedScore * 100) / 100,
  };
}

/** @deprecated use getPickyBitesScore — kept for call sites expecting 1–10 weighted */
export function getCommunityRestaurantScoreLegacyTen(
  restaurantId: string,
  reviews: Review[],
): { average_rating: number; review_count: number; weighted_score: number } {
  const s = getPickyBitesScore(restaurantId, reviews);
  return {
    average_rating: Math.round((s.averageNormalized / 10) * 10) / 10,
    review_count: s.reviewCount,
    weighted_score: Math.round((s.weightedScore / 10) * 10) / 10,
  };
}
