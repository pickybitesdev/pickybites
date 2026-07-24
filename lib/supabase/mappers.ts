import type {
  Comment, Dish, Follow, Like, List, ListItem, ListCollaborator,
  Restaurant, Review, ReviewPhoto, ReviewTag, User, Cuisine, PriceLevel,
  AppNotification, NotificationType, Bookmark, Favorite, WaitTime,
} from "@/lib/types";
import { normalizeCategoryScores } from "@/lib/review-scores";

type DbUser = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  city: string;
  bio: string;
  favorite_cuisines?: string[];
  has_completed_taste_quiz?: boolean;
  created_at: string;
};

type DbRestaurant = {
  id: string;
  google_place_id: string | null;
  name: string;
  address: string;
  city: string;
  cuisine: string;
  price_level: number;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

type DbReview = {
  id: string;
  user_id: string;
  restaurant_id: string;
  rating: number;
  rating_value?: number | null;
  rating_max?: number | null;
  normalized_rating?: number | null;
  visibility?: string | null;
  food_quality?: number | null;
  service_score?: number | null;
  atmosphere?: number | null;
  value_score?: number | null;
  rating_manual_override?: boolean | null;
  wait_time?: string | null;
  would_return?: boolean | null;
  would_recommend?: boolean | null;
  text: string;
  visit_date: string;
  tags: string[];
  created_at: string;
};

type DbDish = {
  id: string;
  review_id: string;
  restaurant_id: string;
  name: string;
  rating: number;
  rating_value?: number | null;
  rating_max?: number | null;
  normalized_rating?: number | null;
  notes: string;
  photo_url: string | null;
  is_best_dish: boolean;
  created_at: string;
};

type DbReviewPhoto = {
  id: string;
  review_id: string;
  url: string;
  created_at: string;
};

type DbFollow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

type DbLike = {
  id: string;
  review_id: string;
  user_id: string;
  created_at: string;
};

type DbComment = {
  id: string;
  review_id: string;
  user_id: string;
  text: string;
  created_at: string;
};

type DbList = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
};

type DbListItem = {
  id: string;
  list_id: string;
  restaurant_id: string;
  note: string;
  position: number;
  created_at: string;
};

function clampPriceLevel(level: number | null | undefined): PriceLevel {
  const n = Number(level);
  if (!Number.isFinite(n)) return 2;
  return Math.min(4, Math.max(1, Math.round(n))) as PriceLevel;
}

export function mapUser(row: DbUser): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    city: row.city ?? "",
    bio: row.bio ?? "",
    favoriteCuisines: (row.favorite_cuisines ?? []) as Cuisine[],
    hasCompletedTasteQuiz: row.has_completed_taste_quiz ?? false,
    createdAt: row.created_at,
  };
}

export function mapRestaurant(row: DbRestaurant): Restaurant {
  return {
    id: row.id,
    googlePlaceId: row.google_place_id,
    name: row.name,
    address: row.address ?? "",
    city: row.city,
    cuisine: row.cuisine as Cuisine,
    priceLevel: clampPriceLevel(row.price_level),
    imageUrl: row.image_url,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
  };
}

export function mapReview(row: DbReview): Review {
  const rating = Number(row.rating);
  const ratingMax = row.rating_max != null ? Number(row.rating_max) : 10;
  const ratingValue = row.rating_value != null ? Number(row.rating_value) : rating;
  const normalizedRating =
    row.normalized_rating != null
      ? Number(row.normalized_rating)
      : Math.min(100, Math.max(0, rating * 10));
  return {
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    rating,
    ratingValue,
    ratingMax,
    normalizedRating,
    visibility: (row.visibility as Review["visibility"]) ?? "friends",
    categoryScores: normalizeCategoryScores(
      row.food_quality != null
        ? {
            foodQuality: Number(row.food_quality),
            service: Number(row.service_score ?? row.rating),
            atmosphere: Number(row.atmosphere ?? row.rating),
            value: Number(row.value_score ?? row.rating),
          }
        : undefined,
      rating,
    ),
    ratingManualOverride: row.rating_manual_override ?? false,
    waitTime: (row.wait_time as WaitTime | null) ?? null,
    wouldReturn: row.would_return ?? null,
    wouldRecommend: row.would_recommend ?? null,
    text: row.text ?? "",
    visitDate: row.visit_date,
    tags: (row.tags ?? []) as ReviewTag[],
    createdAt: row.created_at,
  };
}

export function mapDish(row: DbDish): Dish {
  const rating = Number(row.rating);
  const ratingMax = row.rating_max != null ? Number(row.rating_max) : 10;
  const ratingValue = row.rating_value != null ? Number(row.rating_value) : rating;
  const normalizedRating =
    row.normalized_rating != null
      ? Number(row.normalized_rating)
      : Math.min(100, Math.max(0, rating * 10));
  return {
    id: row.id,
    reviewId: row.review_id,
    restaurantId: row.restaurant_id,
    name: row.name,
    rating,
    ratingValue,
    ratingMax,
    normalizedRating,
    notes: row.notes ?? "",
    photoUrl: row.photo_url,
    isBestDish: row.is_best_dish,
    createdAt: row.created_at,
  };
}

export function mapReviewPhoto(row: DbReviewPhoto): ReviewPhoto {
  return {
    id: row.id,
    reviewId: row.review_id,
    url: row.url,
    createdAt: row.created_at,
  };
}

export function mapFollow(row: DbFollow): Follow {
  return {
    id: row.id,
    followerId: row.follower_id,
    followingId: row.following_id,
    createdAt: row.created_at,
  };
}

export function mapLike(row: DbLike): Like {
  return {
    id: row.id,
    reviewId: row.review_id,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export function mapComment(row: DbComment): Comment {
  return {
    id: row.id,
    reviewId: row.review_id,
    userId: row.user_id,
    text: row.text,
    createdAt: row.created_at,
  };
}

export function mapList(row: DbList): List {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? "",
    isPublic: row.is_public,
    createdAt: row.created_at,
  };
}

export function mapListItem(row: DbListItem): ListItem {
  return {
    id: row.id,
    listId: row.list_id,
    restaurantId: row.restaurant_id,
    note: row.note ?? "",
    position: row.position,
    createdAt: row.created_at,
  };
}

type DbListCollaborator = {
  id: string;
  list_id: string;
  user_id: string;
  created_at: string;
};

export function mapListCollaborator(row: DbListCollaborator): ListCollaborator {
  return {
    id: row.id,
    listId: row.list_id,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

type DbNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  review_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
};

export function mapNotification(row: DbNotification): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    actorId: row.actor_id,
    type: row.type,
    reviewId: row.review_id,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
  };
}

type DbBookmark = {
  id: string;
  user_id: string;
  restaurant_id: string | null;
  google_place_id: string | null;
  place_name: string;
  place_address: string;
  place_city: string;
  place_cuisine: string | null;
  place_image_url: string | null;
  place_price_level: number | null;
  latitude: number | null;
  longitude: number | null;
  status: string | null;
  notes: string | null;
  planned_at: string | null;
  visited_at: string | null;
  created_at: string;
  updated_at: string | null;
  created_via?: string | null;
  resolution_status?: string | null;
  source_platform?: string | null;
  primary_source_title?: string | null;
  primary_source_thumbnail_url?: string | null;
  saved_item_sources?: DbSavedItemSource[] | null;
};

type DbSavedItemSource = {
  id: string;
  saved_restaurant_id: string;
  user_id: string;
  source_url: string;
  canonical_url: string;
  source_platform: string;
  title: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

function mapBucketStatus(raw: string | null | undefined): Bookmark["status"] {
  if (raw === "planned" || raw === "visited") return raw;
  return "want_to_try";
}

function mapCreatedVia(raw: string | null | undefined): Bookmark["createdVia"] {
  if (
    raw === "discover" ||
    raw === "share_extension" ||
    raw === "manual" ||
    raw === "restaurant" ||
    raw === "feed"
  ) {
    return raw;
  }
  return "in_app";
}

function mapResolutionStatus(raw: string | null | undefined): Bookmark["resolutionStatus"] {
  if (raw === "link_only" || raw === "pending_link") return raw;
  return "linked";
}

export function mapSavedItemSource(row: DbSavedItemSource): import("@/lib/types").SavedItemSource {
  return {
    id: row.id,
    savedRestaurantId: row.saved_restaurant_id,
    userId: row.user_id,
    sourceUrl: row.source_url,
    canonicalUrl: row.canonical_url,
    sourcePlatform: (row.source_platform as import("@/lib/types").ShareSourcePlatform) || "unknown",
    title: row.title,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at,
  };
}

export function mapBookmark(row: DbBookmark): Bookmark {
  return {
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    googlePlaceId: row.google_place_id,
    placeName: row.place_name,
    placeAddress: row.place_address,
    placeCity: row.place_city,
    placeCuisine: (row.place_cuisine as Cuisine) ?? null,
    placePriceLevel: row.place_price_level != null ? clampPriceLevel(row.place_price_level) : null,
    placeImageUrl: row.place_image_url,
    latitude: row.latitude,
    longitude: row.longitude,
    status: mapBucketStatus(row.status),
    reasonSaved: row.notes?.trim() || "Saved to bucket list",
    plannedAt: row.planned_at,
    visitedAt: row.visited_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    createdVia: mapCreatedVia(row.created_via),
    resolutionStatus: mapResolutionStatus(row.resolution_status),
    sourcePlatform: (row.source_platform as Bookmark["sourcePlatform"]) ?? null,
    primarySourceTitle: row.primary_source_title ?? null,
    primarySourceThumbnailUrl: row.primary_source_thumbnail_url ?? null,
    sources: (row.saved_item_sources ?? []).map(mapSavedItemSource),
  };
}

type DbFavorite = {
  id: string;
  user_id: string;
  restaurant_id: string | null;
  dish_id: string | null;
  created_at: string;
};

export function mapFavorite(row: DbFavorite): Favorite {
  return {
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    dishId: row.dish_id,
    createdAt: row.created_at,
  };
}
