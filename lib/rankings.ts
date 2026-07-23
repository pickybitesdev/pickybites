import type { Cuisine, Dish, PriceLevel, RankingFilters, Restaurant, Review, ReviewTag } from "./types";
import type { RankingCategoryId } from "./ranking-categories";
import { reviewMatchesRankingCategory } from "./ranking-categories";
import { getReviewOverallRating } from "./review-scores";
import { getPickyBitesScore } from "./pickybites-score";

export type LeaderboardEntry = {
  rank: number;
  restaurant_id: string;
  restaurant_name: string;
  image_url: string | null;
  cuisine: Cuisine;
  city: string;
  average_score: number;
  last_visit_date: string;
  review_count: number;
  restaurant: Restaurant;
};

export type UserRestaurantRanking = {
  rank: number;
  restaurant_id: string;
  restaurant_name: string;
  image_url: string | null;
  cuisine: Cuisine;
  city: string;
  rating: number;
  average_score: number;
  review_count_by_user: number;
  last_visit_date: string;
  tags: ReviewTag[];
};

export type UserDishRanking = {
  rank: number;
  dish_id: string;
  dish_name: string;
  restaurant_name: string;
  restaurant_id: string;
  dish_rating: number;
  photo_url: string | null;
  is_favorite: boolean;
  dish_notes: string;
};

export type CommunityRestaurantScore = {
  average_rating: number;
  review_count: number;
  weighted_score: number;
  /** 0–100 PickyBites community score */
  pickybites_score: number;
};

export type CityRankingItem = {
  rank: number;
  restaurant: Restaurant;
  average_rating: number;
  review_count: number;
  weighted_score: number;
};

export type DishRanking = {
  dish: Dish;
  restaurant: Restaurant;
  review: Review;
  rating: number;
};

/** Weighted PickyBites score (0–100 normalized). Also exposes legacy 1–10 fields. */
export function getCommunityRestaurantScore(
  restaurantId: string,
  reviews: Review[],
  priorMean = 70,
  priorWeight = 5,
): CommunityRestaurantScore {
  const s = getPickyBitesScore(restaurantId, reviews, priorMean, priorWeight);
  return {
    average_rating: Math.round((s.averageNormalized / 10) * 10) / 10,
    review_count: s.reviewCount,
    weighted_score: Math.round((s.weightedScore / 10) * 10) / 10,
    pickybites_score: Math.round(s.weightedScore),
  };
}

export function getUserRestaurantRankings(
  userId: string,
  reviews: Review[],
  restaurants: Restaurant[],
  filters: RankingFilters = {},
): UserRestaurantRanking[] {
  const rMap = new Map(restaurants.map((r) => [r.id, r]));
  const byRestaurant = new Map<string, Review[]>();

  reviews
    .filter((r) => r.userId === userId)
    .filter((r) => !filters.tag || r.tags.includes(filters.tag!))
    .forEach((review) => {
      const arr = byRestaurant.get(review.restaurantId) ?? [];
      arr.push(review);
      byRestaurant.set(review.restaurantId, arr);
    });

  const items = [...byRestaurant.entries()]
    .map(([restaurantId, userReviews]) => {
      const restaurant = rMap.get(restaurantId);
      if (!restaurant) return null;
      if (filters.city && restaurant.city !== filters.city) return null;
      if (filters.cuisine && restaurant.cuisine !== filters.cuisine) return null;
      if (filters.priceLevel && restaurant.priceLevel !== filters.priceLevel) return null;

      const sorted = [...userReviews].sort(
        (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime(),
      );
      const best = [...userReviews].sort((a, b) => getReviewOverallRating(b) - getReviewOverallRating(a))[0];
      const average_score =
        userReviews.reduce((s, r) => s + getReviewOverallRating(r), 0) / userReviews.length;
      const tags = [...new Set(userReviews.flatMap((r) => r.tags))];

      return {
        restaurant,
        rating: getReviewOverallRating(best),
        average_score: Math.round(average_score * 10) / 10,
        review_count_by_user: userReviews.length,
        last_visit_date: sorted[0].visitDate,
        tags,
      };
    })
    .filter(Boolean) as {
      restaurant: Restaurant;
      rating: number;
      average_score: number;
      review_count_by_user: number;
      last_visit_date: string;
      tags: ReviewTag[];
    }[];

  return items
    .sort((a, b) => {
      if (b.average_score !== a.average_score) return b.average_score - a.average_score;
      const dateDiff =
        new Date(b.last_visit_date).getTime() - new Date(a.last_visit_date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.restaurant.name.localeCompare(b.restaurant.name);
    })
    .map((item, index) => ({
      rank: index + 1,
      restaurant_id: item.restaurant.id,
      restaurant_name: item.restaurant.name,
      image_url: item.restaurant.imageUrl,
      cuisine: item.restaurant.cuisine,
      city: item.restaurant.city,
      rating: item.rating,
      average_score: item.average_score,
      review_count_by_user: item.review_count_by_user,
      last_visit_date: item.last_visit_date,
      tags: item.tags,
    }));
}

/** Category & tag leaderboards — recomputed from reviews on every call. */
export function getLeaderboardRankings(
  userId: string,
  categoryId: RankingCategoryId,
  reviews: Review[],
  restaurants: Restaurant[],
  dishes: Dish[],
): LeaderboardEntry[] {
  const rMap = new Map(restaurants.map((r) => [r.id, r]));
  const byRestaurant = new Map<string, Review[]>();

  reviews
    .filter((r) => r.userId === userId)
    .forEach((review) => {
      const restaurant = rMap.get(review.restaurantId);
      if (!restaurant) return;
      if (!reviewMatchesRankingCategory(categoryId, review, restaurant, dishes)) return;

      const arr = byRestaurant.get(review.restaurantId) ?? [];
      arr.push(review);
      byRestaurant.set(review.restaurantId, arr);
    });

  const items = [...byRestaurant.entries()]
    .map(([restaurantId, userReviews]) => {
      const restaurant = rMap.get(restaurantId)!;
      const sorted = [...userReviews].sort(
        (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime(),
      );
      const average_score =
        userReviews.reduce((s, r) => s + getReviewOverallRating(r), 0) / userReviews.length;

      return {
        restaurant,
        average_score: Math.round(average_score * 10) / 10,
        last_visit_date: sorted[0].visitDate,
        review_count: userReviews.length,
      };
    })
    .sort((a, b) => {
      if (b.average_score !== a.average_score) return b.average_score - a.average_score;
      const dateDiff =
        new Date(b.last_visit_date).getTime() - new Date(a.last_visit_date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.restaurant.name.localeCompare(b.restaurant.name);
    });

  return items.map((item, index) => ({
    rank: index + 1,
    restaurant_id: item.restaurant.id,
    restaurant_name: item.restaurant.name,
    image_url: item.restaurant.imageUrl,
    cuisine: item.restaurant.cuisine,
    city: item.restaurant.city,
    average_score: item.average_score,
    last_visit_date: item.last_visit_date,
    review_count: item.review_count,
    restaurant: item.restaurant,
  }));
}

export function getUserDishRankings(
  userId: string,
  reviews: Review[],
  dishes: Dish[],
  restaurants: Restaurant[],
  filters: RankingFilters = {},
): UserDishRanking[] {
  const rMap = new Map(restaurants.map((r) => [r.id, r]));
  const userReviewIds = new Set(reviews.filter((r) => r.userId === userId).map((r) => r.id));

  return dishes
    .filter((d) => userReviewIds.has(d.reviewId))
    .map((dish) => {
      const restaurant = rMap.get(dish.restaurantId);
      const review = reviews.find((r) => r.id === dish.reviewId);
      if (!restaurant || !review) return null;
      if (filters.tag && !review.tags.includes(filters.tag!)) return null;
      if (filters.city && restaurant.city !== filters.city) return null;
      if (filters.cuisine && restaurant.cuisine !== filters.cuisine) return null;
      return { dish, restaurant };
    })
    .filter(Boolean)
    .map((x) => x!)
    .sort((a, b) => {
      if (b.dish.rating !== a.dish.rating) return b.dish.rating - a.dish.rating;
      if (a.dish.isBestDish !== b.dish.isBestDish) return a.dish.isBestDish ? -1 : 1;
      return new Date(b.dish.createdAt).getTime() - new Date(a.dish.createdAt).getTime();
    })
    .map((item, index) => ({
      rank: index + 1,
      dish_id: item.dish.id,
      dish_name: item.dish.name,
      restaurant_name: item.restaurant.name,
      restaurant_id: item.restaurant.id,
      dish_rating: item.dish.rating,
      photo_url: item.dish.photoUrl,
      is_favorite: item.dish.isBestDish,
      dish_notes: item.dish.notes,
    }));
}

export function getCityRankings(
  city: string,
  reviews: Review[],
  restaurants: Restaurant[],
  cuisine?: Cuisine,
  limit = 20,
): CityRankingItem[] {
  const inCity = restaurants.filter(
    (r) => r.city.toLowerCase() === city.toLowerCase() && (!cuisine || r.cuisine === cuisine),
  );

  return inCity
    .map((restaurant) => {
      const score = getCommunityRestaurantScore(restaurant.id, reviews);
      return { restaurant, ...score };
    })
    .filter((x) => x.review_count > 0)
    .sort((a, b) => b.weighted_score - a.weighted_score)
    .slice(0, limit)
    .map((item, index) => ({
      rank: index + 1,
      restaurant: item.restaurant,
      average_rating: item.average_rating,
      review_count: item.review_count,
      weighted_score: item.weighted_score,
    }));
}

/** @deprecated Use getUserRestaurantRankings — kept for existing UI. */
export function getRestaurantRankings(
  userId: string,
  reviews: Review[],
  restaurants: Restaurant[],
  filters: RankingFilters = {},
  limit = 10,
) {
  return getUserRestaurantRankings(userId, reviews, restaurants, filters)
    .slice(0, limit)
    .map((item) => ({
      review: reviews.find(
        (r) => r.userId === userId && r.restaurantId === item.restaurant_id,
      )!,
      restaurant: restaurants.find((r) => r.id === item.restaurant_id)!,
      rating: item.rating,
    }))
    .filter((x) => x.review && x.restaurant);
}

/** @deprecated Use getUserDishRankings — kept for existing UI. */
export function getDishRankings(
  userId: string,
  reviews: Review[],
  dishes: Dish[],
  restaurants: Restaurant[],
  filters: RankingFilters = {},
  limit = 10,
): DishRanking[] {
  const rMap = new Map(restaurants.map((r) => [r.id, r]));
  const revMap = new Map(reviews.map((r) => [r.id, r]));
  return getUserDishRankings(userId, reviews, dishes, restaurants, filters)
    .slice(0, limit)
    .map((item) => ({
      dish: dishes.find((d) => d.id === item.dish_id)!,
      restaurant: rMap.get(item.restaurant_id)!,
      review: revMap.get(dishes.find((d) => d.id === item.dish_id)!.reviewId)!,
      rating: item.dish_rating,
    }))
    .filter((x) => x.dish && x.restaurant && x.review);
}
