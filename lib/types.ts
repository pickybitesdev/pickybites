export type PriceLevel = 1 | 2 | 3 | 4;

export type ReviewTag =
  | "Date Night"
  | "Casual"
  | "Hidden Gem"
  | "Vegan Friendly"
  | "Worth the Wait"
  | "Overrated"
  | "Great Service"
  | "Bad Service"
  | "Must Try"
  | "Great Value"
  | "Worth Traveling For"
  | "Best Service"
  | "Family Friendly"
  | "Solo Dining";

export const REVIEW_TAGS: ReviewTag[] = [
  "Date Night",
  "Casual",
  "Hidden Gem",
  "Vegan Friendly",
  "Must Try",
  "Great Value",
  "Worth Traveling For",
  "Best Service",
  "Family Friendly",
  "Solo Dining",
  "Worth the Wait",
  "Great Service",
  "Overrated",
  "Bad Service",
];

export const CUISINES = [
  "Italian",
  "Japanese",
  "Mexican",
  "Thai",
  "Indian",
  "French",
  "American",
  "Korean",
  "Chinese",
  "Mediterranean",
  "Vietnamese",
  "Caribbean",
  "Spanish",
  "Greek",
] as const;

export type Cuisine = (typeof CUISINES)[number];

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  bio: string;
  favoriteCuisines: Cuisine[];
  hasCompletedTasteQuiz: boolean;
  createdAt: string;
}

export type NotificationType = "like" | "comment" | "follow";

export interface AppNotification {
  id: string;
  userId: string;
  actorId: string | null;
  type: NotificationType;
  reviewId: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export type BucketListStatus = "want_to_try" | "planned" | "visited";

export const BUCKET_LIST_STATUS_LABELS: Record<BucketListStatus, string> = {
  want_to_try: "Try Next",
  planned: "Planned",
  visited: "Visited",
};

export const BUCKET_SAVE_REASONS = [
  "Looks interesting",
  "Friend recommended",
  "Special occasion",
  "Near me",
  "Trending spot",
  "Saved from Discover",
] as const;

export interface Bookmark {
  id: string;
  userId: string;
  restaurantId: string | null;
  googlePlaceId: string | null;
  placeName: string;
  placeAddress: string;
  placeCity: string;
  placeCuisine: Cuisine | null;
  placePriceLevel: PriceLevel | null;
  placeImageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  status: BucketListStatus;
  reasonSaved: string;
  plannedAt: string | null;
  visitedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  id: string;
  googlePlaceId?: string | null;
  name: string;
  address: string;
  city: string;
  cuisine: Cuisine;
  priceLevel: PriceLevel;
  imageUrl: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
}

export interface Dish {
  id: string;
  reviewId: string;
  restaurantId: string;
  name: string;
  /** Legacy 1–10 dish rating. */
  rating: number;
  ratingValue: number;
  ratingMax: number;
  normalizedRating: number;
  notes: string;
  photoUrl: string | null;
  isBestDish: boolean;
  createdAt: string;
}

export interface ReviewPhoto {
  id: string;
  reviewId: string;
  url: string;
  createdAt: string;
}

export interface ReviewCategoryScores {
  foodQuality: number;
  service: number;
  atmosphere: number;
  value: number;
}

export type WaitTime = "under_15" | "15_30" | "30_60" | "over_60";

export type ReviewVisibility = "private" | "friends" | "public";

export type ComparisonPreference = "current" | "compared" | "equal";

export interface Review {
  id: string;
  userId: string;
  restaurantId: string;
  /** Legacy 1–10 overall (synced from normalized during transition). */
  rating: number;
  /** User's chosen score on their personal scale. */
  ratingValue: number;
  /** User's chosen maximum (5–1000). */
  ratingMax: number;
  /** 0–100 public/normalized score. */
  normalizedRating: number;
  visibility: ReviewVisibility;
  categoryScores: ReviewCategoryScores;
  ratingManualOverride: boolean;
  waitTime: WaitTime | null;
  wouldReturn: boolean | null;
  wouldRecommend: boolean | null;
  text: string;
  visitDate: string;
  tags: ReviewTag[];
  createdAt: string;
}

export interface ReviewComparison {
  id: string;
  userId: string;
  reviewId: string;
  currentRestaurantId: string;
  comparedRestaurantId: string;
  preference: ComparisonPreference;
  reason: string;
  createdAt: string;
}

/** Explicit user favorite — exactly one of restaurantId or dishId. */
export interface Favorite {
  id: string;
  userId: string;
  restaurantId: string | null;
  dishId: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  reviewId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Like {
  id: string;
  reviewId: string;
  userId: string;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface ListCollaborator {
  id: string;
  listId: string;
  userId: string;
  createdAt: string;
}

export interface List {
  id: string;
  userId: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
}

export interface ListItem {
  id: string;
  listId: string;
  restaurantId: string;
  note: string;
  position: number;
  createdAt: string;
}

export interface TasteDNA {
  favoriteCuisines: { cuisine: Cuisine; count: number; avgRating: number }[];
  averageRating: number;
  categoryAverages: ReviewCategoryScores;
  mostReviewedCuisine: Cuisine | null;
  topCuisine: Cuisine | null;
  top3Cuisines: Cuisine[];
  mostVisitedCity: string | null;
  favoriteRestaurantType: string;
  cuisinesTried: number;
  topCuisineShare: number;
  spicyCuisineShare: number;
  americanShare: number;
  casualTagShare: number;
  cityConcentration: number;
  fineDiningShare: number;
  preferredPriceLevel: PriceLevel | null;
  adventureScore: number;
  hiddenGemScore: number;
  luxuryScore: number;
  dateNightScore: number;
  veganFriendlyScore: number;
  topDishes: Dish[];
  topRestaurants: { restaurant: Restaurant; rating: number }[];
  personality: import("./taste-personality").TastePersonalityProfile;
}

/** Full Taste DNA output used by core engine + hooks. */
export interface CoreTasteDna {
  taste_label: string;
  food_personality: import("./taste-personality").TastePersonalityLabel;
  personality_headline: string;
  personality_explanation: string;
  top_cuisine: Cuisine | string;
  top_3_cuisines: Cuisine[];
  most_visited_city: string | null;
  favorite_restaurant_type: string;
  average_rating: number;
  total_reviews: number;
  total_dishes: number;
  cuisines_tried: number;
  preferred_price_level: PriceLevel | null;
  adventure_score: number;
  hidden_gem_score: number;
  date_night_score: number;
  vegan_score: number;
  top_restaurants: { restaurant: Restaurant; rating: number }[];
  top_dishes: Dish[];
  /** Backward-compatible UI shape */
  legacy: TasteDNA;
}

export interface Recommendation {
  restaurant: Restaurant;
  confidence: number;
  reason: string;
}

export interface RankingFilters {
  city?: string;
  cuisine?: Cuisine;
  priceLevel?: PriceLevel;
  tag?: ReviewTag;
}
