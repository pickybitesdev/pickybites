import type {
  Cuisine,
  PriceLevel,
  ReviewCategoryScores,
  ReviewTag,
  ReviewVisibility,
  WaitTime,
} from "./types";
import { validateCategoryScores } from "./review-scores";
import { validateRatingScale } from "./rating-scale";

export type ReviewSubmitPayload = {
  restaurantName?: string;
  restaurantId?: string;
  placeName?: string;
  rating: number;
  ratingValue?: number;
  ratingMax?: number;
  visibility?: ReviewVisibility;
  categoryScores: ReviewCategoryScores;
  ratingManualOverride?: boolean;
  waitTime?: WaitTime | null;
  wouldReturn?: boolean | null;
  wouldRecommend?: boolean | null;
  text: string;
  visitDate: string;
  cuisine?: Cuisine;
  city?: string;
  state?: string;
  priceLevel?: PriceLevel;
  tags: ReviewTag[];
  dishes: {
    name: string;
    rating: number;
    ratingValue?: number;
    ratingMax?: number;
    notes?: string;
    isBestDish?: boolean;
  }[];
};

export type ReviewValidationResult = { ok: true } | { ok: false; error: string };

const MAX_REVIEW_TEXT = 750;

export function validateReviewSubmit(data: ReviewSubmitPayload): ReviewValidationResult {
  const hasRestaurant =
    Boolean(data.restaurantId?.trim()) ||
    Boolean(data.placeName?.trim()) ||
    Boolean(data.restaurantName?.trim());

  if (!hasRestaurant) {
    return { ok: false, error: "Restaurant name is required." };
  }

  const categoryError = validateCategoryScores(data.categoryScores);
  if (categoryError) {
    return { ok: false, error: categoryError };
  }

  const ratingMax = data.ratingMax ?? 10;
  const ratingValue = data.ratingValue ?? data.rating;
  const scale = validateRatingScale(ratingValue, ratingMax);
  if (!scale.ok) {
    return { ok: false, error: scale.error };
  }

  if (data.ratingValue == null && data.ratingMax == null) {
    if (!Number.isFinite(data.rating) || data.rating < 1 || data.rating > 10) {
      return { ok: false, error: "Overall rating must be between 1.0 and 10.0." };
    }
  }

  if (data.visibility && !["private", "friends", "public"].includes(data.visibility)) {
    return { ok: false, error: "Invalid visibility." };
  }

  if (!data.visitDate?.trim()) {
    return { ok: false, error: "Visit date is required." };
  }

  if (data.text.length > MAX_REVIEW_TEXT) {
    return { ok: false, error: `Review text must be ${MAX_REVIEW_TEXT} characters or less.` };
  }

  if (!data.restaurantId && !data.cuisine) {
    return { ok: false, error: "At least one cuisine is required for a new restaurant." };
  }

  for (const dish of data.dishes) {
    if (!dish.name.trim()) continue;
    const dMax = dish.ratingMax ?? ratingMax;
    const dVal = dish.ratingValue ?? dish.rating;
    const dishScale = validateRatingScale(dVal, dMax);
    if (!dishScale.ok) {
      return { ok: false, error: `Dish rating for "${dish.name}": ${dishScale.error}` };
    }
  }

  return { ok: true };
}

export function clampRating(value: number) {
  return Math.min(10, Math.max(1, Math.round(value * 10) / 10));
}
