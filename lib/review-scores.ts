import type { Review, ReviewCategoryScores, WaitTime } from "./types";
import { clampRating } from "./review-validation";

export const CATEGORY_LABELS: { key: keyof ReviewCategoryScores; label: string }[] = [
  { key: "foodQuality", label: "Food Quality" },
  { key: "service", label: "Service" },
  { key: "atmosphere", label: "Atmosphere" },
  { key: "value", label: "Value" },
];

export const WAIT_TIME_OPTIONS: { value: WaitTime; label: string }[] = [
  { value: "under_15", label: "Under 15 min" },
  { value: "15_30", label: "15–30 min" },
  { value: "30_60", label: "30–60 min" },
  { value: "over_60", label: "Over 60 min" },
];

export const DEFAULT_CATEGORY_SCORES: ReviewCategoryScores = {
  foodQuality: 8,
  service: 8,
  atmosphere: 8,
  value: 8,
};

export function scoresFromOverall(rating: number): ReviewCategoryScores {
  const base = clampRating(rating);
  return {
    foodQuality: base,
    service: base,
    atmosphere: base,
    value: base,
  };
}

export function computeAutoOverall(scores: ReviewCategoryScores): number {
  const sum =
    scores.foodQuality + scores.service + scores.atmosphere + scores.value;
  return clampRating(sum / 4);
}

export function normalizeCategoryScores(
  scores: Partial<ReviewCategoryScores> | undefined,
  fallbackRating: number,
): ReviewCategoryScores {
  const base = scoresFromOverall(fallbackRating);
  if (!scores) return base;
  return {
    foodQuality: clampRating(scores.foodQuality ?? base.foodQuality),
    service: clampRating(scores.service ?? base.service),
    atmosphere: clampRating(scores.atmosphere ?? base.atmosphere),
    value: clampRating(scores.value ?? base.value),
  };
}

/** Canonical overall score for rankings, journal averages, and profile stats (1–10 legacy). */
export function getReviewOverallRating(review: Review): number {
  return clampRating(review.rating);
}

/** 0–100 normalized rating for PickyBites community score. */
export function getNormalizedRating(review: Review): number {
  if (typeof review.normalizedRating === "number" && Number.isFinite(review.normalizedRating)) {
    return Math.min(100, Math.max(0, review.normalizedRating));
  }
  return Math.min(100, Math.max(0, Math.round(clampRating(review.rating) * 10 * 100) / 100));
}

export function averageCategoryScore(
  reviews: Review[],
  key: keyof ReviewCategoryScores,
): number {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((s, r) => s + r.categoryScores[key], 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function averageOverallRating(reviews: Review[]): number {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((s, r) => s + getReviewOverallRating(r), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export type StructuredReviewInput = {
  rating: number;
  categoryScores: ReviewCategoryScores;
  ratingManualOverride?: boolean;
  waitTime?: WaitTime | null;
  wouldReturn?: boolean | null;
  wouldRecommend?: boolean | null;
};

export function buildStructuredReviewFields(input: StructuredReviewInput) {
  const categoryScores = normalizeCategoryScores(input.categoryScores, input.rating);
  const autoOverall = computeAutoOverall(categoryScores);
  const rating = input.ratingManualOverride
    ? clampRating(input.rating)
    : autoOverall;

  return {
    rating,
    categoryScores,
    ratingManualOverride: Boolean(input.ratingManualOverride),
    waitTime: input.waitTime ?? null,
    wouldReturn: input.wouldReturn ?? null,
    wouldRecommend: input.wouldRecommend ?? null,
  };
}

export function validateCategoryScores(scores: ReviewCategoryScores): string | null {
  for (const { key, label } of CATEGORY_LABELS) {
    const v = scores[key];
    if (!Number.isFinite(v) || v < 1 || v > 10) {
      return `${label} must be between 1.0 and 10.0.`;
    }
  }
  return null;
}
