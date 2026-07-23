import type {
  Dish,
  Restaurant,
  Review,
  ReviewPhoto,
  ReviewTag,
  ReviewCategoryScores,
  WaitTime,
  ReviewVisibility,
} from "./types";
import { getReviewOverallRating } from "./review-scores";
import { tenPointFromNormalized } from "./rating-scale";

export type FoodJournalEntry = {
  review_id: string;
  restaurant_id: string;
  restaurant_name: string;
  cuisine: string;
  city: string;
  /** Legacy display rating (1–10 scale). */
  rating: number;
  rating_value: number;
  rating_max: number;
  /** Normalized 0–100 PickyBites score. */
  normalized_rating: number;
  visibility: ReviewVisibility;
  category_scores: ReviewCategoryScores;
  rating_manual_override: boolean;
  wait_time: WaitTime | null;
  would_return: boolean | null;
  would_recommend: boolean | null;
  visit_date: string;
  review_text: string;
  tags: ReviewTag[];
  photos: string[];
  latitude: number | null;
  longitude: number | null;
  dishes: {
    dish_id: string;
    dish_name: string;
    dish_rating: number;
    dish_notes: string;
    is_favorite: boolean;
    photo_url: string | null;
  }[];
};

export type FoodJournalMonth = {
  month: string;
  month_key: string;
  total_visits: number;
  unique_cuisines: number;
  /** Average score on the 1–10 display scale. */
  average_rating: number;
  top_meal: string | null;
  entries: FoodJournalEntry[];
};

export type FoodJournalStats = {
  restaurantsVisited: number;
  cuisinesTried: number;
  averageRating: number;
  cities: number;
};

export const FOOD_JOURNAL_EMPTY =
  "No food memories yet. Write your first review to start your timeline.";

function monthKey(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function toFoodJournalEntry(
  review: Review,
  restaurant: Restaurant | undefined,
  dishes: Dish[],
  reviewPhotos: ReviewPhoto[],
): FoodJournalEntry {
  const reviewDishes = dishes.filter((d) => d.reviewId === review.id);
  const photos = reviewPhotos.filter((p) => p.reviewId === review.id).map((p) => p.url);

  return {
    review_id: review.id,
    restaurant_id: review.restaurantId,
    restaurant_name: restaurant?.name ?? "Unknown",
    cuisine: restaurant?.cuisine ?? "Unknown",
    city: restaurant?.city ?? "",
    rating: getReviewOverallRating(review),
    rating_value: review.ratingValue,
    rating_max: review.ratingMax,
    normalized_rating: review.normalizedRating,
    visibility: review.visibility,
    category_scores: review.categoryScores,
    rating_manual_override: review.ratingManualOverride,
    wait_time: review.waitTime,
    would_return: review.wouldReturn,
    would_recommend: review.wouldRecommend,
    visit_date: review.visitDate,
    review_text: review.text,
    tags: review.tags,
    photos,
    latitude: restaurant?.latitude ?? null,
    longitude: restaurant?.longitude ?? null,
    dishes: reviewDishes.map((d) => ({
      dish_id: d.id,
      dish_name: d.name,
      dish_rating: d.rating,
      dish_notes: d.notes,
      is_favorite: d.isBestDish,
      photo_url: d.photoUrl,
    })),
  };
}

export function getFoodJournalEntries(
  userId: string,
  reviews: Review[],
  restaurants: Restaurant[],
  dishes: Dish[],
  reviewPhotos: ReviewPhoto[],
): FoodJournalEntry[] {
  const rMap = new Map(restaurants.map((r) => [r.id, r]));
  return reviews
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
    .map((review) =>
      toFoodJournalEntry(review, rMap.get(review.restaurantId), dishes, reviewPhotos),
    );
}

export function groupJournalByMonth(entries: FoodJournalEntry[]): FoodJournalMonth[] {
  const groups = new Map<string, FoodJournalEntry[]>();
  entries.forEach((entry) => {
    const key = monthKey(entry.visit_date);
    const arr = groups.get(key) ?? [];
    arr.push(entry);
    groups.set(key, arr);
  });

  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, monthEntries]) => {
      const cuisines = new Set(monthEntries.map((e) => e.cuisine).filter(Boolean));
      const avgNormalized =
        monthEntries.reduce((s, e) => s + e.normalized_rating, 0) /
        Math.max(monthEntries.length, 1);

      const topDish = monthEntries
        .flatMap((e) => e.dishes)
        .sort((a, b) => b.dish_rating - a.dish_rating)[0];
      const topRestaurant = [...monthEntries].sort(
        (a, b) => b.normalized_rating - a.normalized_rating,
      )[0];

      return {
        month: monthLabel(key),
        month_key: key,
        total_visits: monthEntries.length,
        unique_cuisines: cuisines.size,
        average_rating: tenPointFromNormalized(avgNormalized),
        top_meal: topDish?.dish_name ?? topRestaurant?.restaurant_name ?? null,
        entries: monthEntries,
      };
    });
}

export function getFoodJournal(
  userId: string,
  reviews: Review[],
  restaurants: Restaurant[],
  dishes: Dish[],
  reviewPhotos: ReviewPhoto[],
): FoodJournalMonth[] {
  return groupJournalByMonth(
    getFoodJournalEntries(userId, reviews, restaurants, dishes, reviewPhotos),
  );
}

export function getFoodJournalStats(entries: FoodJournalEntry[]): FoodJournalStats {
  const restaurants = new Set(entries.map((e) => e.restaurant_id));
  const cuisines = new Set(entries.map((e) => e.cuisine).filter(Boolean));
  const cities = new Set(entries.map((e) => e.city).filter(Boolean));
  const avgNormalized =
    entries.length === 0
      ? 0
      : entries.reduce((s, e) => s + e.normalized_rating, 0) / entries.length;

  return {
    restaurantsVisited: restaurants.size,
    cuisinesTried: cuisines.size,
    averageRating: tenPointFromNormalized(avgNormalized),
    cities: cities.size,
  };
}

export function journalHasMapPins(entries: FoodJournalEntry[]): boolean {
  return entries.some((e) => e.latitude != null && e.longitude != null);
}
