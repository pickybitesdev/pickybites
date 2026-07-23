import { getSupabase } from "./client";
import {
  mapUser, mapRestaurant, mapReview, mapDish, mapReviewPhoto,
  mapFollow, mapLike, mapComment, mapList, mapListItem, mapListCollaborator, mapNotification, mapBookmark,
  mapFavorite,
} from "./mappers";
import { uploadReviewPhoto } from "./storage";
import type {
  Comment, Dish, Follow, Like, List, ListItem, ListCollaborator,
  Restaurant, Review, ReviewPhoto, ReviewTag, ReviewCategoryScores, WaitTime, User, AppNotification, Bookmark,
  Favorite, ReviewVisibility, ComparisonPreference,
} from "@/lib/types";
import type { Restaurant as RestaurantType } from "@/lib/types";
import type { PlaceResult } from "@/lib/places/types";
import { buildStructuredReviewFields } from "@/lib/review-scores";
import { buildNormalizedRating, legacyTenPointFromNormalized } from "@/lib/rating-scale";
import { createNotification } from "./tier1";

/** Tier B/C tables — app works without these until you run the matching migrations. */
function isOptionalTableMissing(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("list_collaborators") ||
    m.includes("favorites") ||
    m.includes("schema cache") ||
    m.includes("does not exist") ||
    m.includes("could not find the table")
  );
}

export type AppData = {
  users: User[];
  restaurants: Restaurant[];
  reviews: Review[];
  dishes: Dish[];
  likes: Like[];
  comments: Comment[];
  follows: Follow[];
  lists: List[];
  listItems: ListItem[];
  listCollaborators: ListCollaborator[];
  reviewPhotos: ReviewPhoto[];
  notifications: AppNotification[];
  bookmarks: Bookmark[];
  favorites: Favorite[];
};

export async function fetchAllData(userId?: string | null): Promise<AppData> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const notifQuery = userId
    ? supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50)
    : Promise.resolve({ data: [] as never[], error: null });

  const bookmarkQuery = userId
    ? supabase.from("bookmarks").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    : Promise.resolve({ data: [] as never[], error: null });

  const favoritesQuery = userId
    ? supabase.from("favorites").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    : Promise.resolve({ data: [] as never[], error: null });

  const [
    usersRes, restaurantsRes, reviewsRes, dishesRes, photosRes,
    followsRes, likesRes, commentsRes, listsRes, listItemsRes, listCollabRes, notifRes, bookmarkRes,
    favoritesRes,
  ] = await Promise.all([
    supabase.from("users").select("*"),
    supabase.from("restaurants").select("*").order("created_at", { ascending: false }),
    supabase.from("reviews").select("*").order("created_at", { ascending: false }),
    supabase.from("dishes").select("*"),
    supabase.from("review_photos").select("*"),
    supabase.from("follows").select("*"),
    supabase.from("likes").select("*"),
    supabase.from("comments").select("*").order("created_at", { ascending: true }),
    supabase.from("lists").select("*"),
    supabase.from("list_items").select("*").order("position", { ascending: true }),
    supabase.from("list_collaborators").select("*"),
    notifQuery,
    bookmarkQuery,
    favoritesQuery,
  ]);

  const firstError = [
    usersRes, restaurantsRes, reviewsRes, dishesRes, photosRes,
    followsRes, likesRes, commentsRes, listsRes, listItemsRes, notifRes, bookmarkRes,
  ].find((r) => r.error);

  if (firstError?.error) throw new Error(firstError.error.message);

  if (listCollabRes.error && !isOptionalTableMissing(listCollabRes.error.message)) {
    throw new Error(listCollabRes.error.message);
  }

  const favoritesMissing =
    favoritesRes.error && isOptionalTableMissing(favoritesRes.error.message);

  if (favoritesRes.error && !favoritesMissing) {
    throw new Error(favoritesRes.error.message);
  }

  return {
    users: (usersRes.data ?? []).map(mapUser),
    restaurants: (restaurantsRes.data ?? []).map(mapRestaurant),
    reviews: (reviewsRes.data ?? []).map(mapReview),
    dishes: (dishesRes.data ?? []).map(mapDish),
    reviewPhotos: (photosRes.data ?? []).map(mapReviewPhoto),
    follows: (followsRes.data ?? []).map(mapFollow),
    likes: (likesRes.data ?? []).map(mapLike),
    comments: (commentsRes.data ?? []).map(mapComment),
    lists: (listsRes.data ?? []).map(mapList),
    listItems: (listItemsRes.data ?? []).map(mapListItem),
    listCollaborators: listCollabRes.error
      ? []
      : (listCollabRes.data ?? []).map(mapListCollaborator),
    notifications: (notifRes.data ?? []).map(mapNotification),
    bookmarks: (bookmarkRes.data ?? []).map(mapBookmark),
    favorites: favoritesMissing ? [] : (favoritesRes.data ?? []).map(mapFavorite),
  };
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(error.message);
  return data.user?.id ?? null;
}

export async function signUp(data: {
  email: string;
  password: string;
  username: string;
  displayName: string;
  city: string;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email.trim().toLowerCase(),
    password: data.password,
    options: {
      data: {
        username: data.username.trim().toLowerCase(),
        display_name: data.displayName.trim(),
        city: data.city.trim(),
      },
    },
  });
  if (error) throw new Error(error.message);
  return authData.user?.id ?? null;
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSessionUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, "displayName" | "username" | "city" | "bio" | "avatarUrl" | "favoriteCuisines" | "hasCompletedTasteQuiz">>
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const payload: Record<string, string | null | boolean | string[]> = {};
  if (updates.displayName !== undefined) payload.display_name = updates.displayName;
  if (updates.username !== undefined) payload.username = updates.username;
  if (updates.city !== undefined) payload.city = updates.city;
  if (updates.bio !== undefined) payload.bio = updates.bio;
  if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
  if (updates.favoriteCuisines !== undefined) payload.favorite_cuisines = updates.favoriteCuisines;
  if (updates.hasCompletedTasteQuiz !== undefined) payload.has_completed_taste_quiz = updates.hasCompletedTasteQuiz;

  const { error } = await supabase.from("users").update(payload).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function findOrCreateRestaurantFromPlace(place: PlaceResult): Promise<Restaurant> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: existing } = await supabase
    .from("restaurants")
    .select("*")
    .eq("google_place_id", place.googlePlaceId)
    .maybeSingle();

  if (existing) return mapRestaurant(existing);

  const { data: created, error } = await supabase
    .from("restaurants")
    .insert({
      google_place_id: place.googlePlaceId,
      name: place.name,
      address: place.address,
      city: place.city,
      cuisine: place.cuisine,
      price_level: place.priceLevel,
      image_url: place.imageUrl,
      latitude: place.latitude,
      longitude: place.longitude,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRestaurant(created);
}

export async function createReview(
  userId: string,
  data: {
    restaurantId?: string;
    place?: PlaceResult;
    restaurantName?: string;
    address?: string;
    city?: string;
    cuisine?: RestaurantType["cuisine"];
    priceLevel?: RestaurantType["priceLevel"];
    rating: number;
    ratingValue?: number;
    ratingMax?: number;
    normalizedRating?: number;
    visibility?: ReviewVisibility;
    categoryScores: ReviewCategoryScores;
    ratingManualOverride?: boolean;
    waitTime?: WaitTime | null;
    wouldReturn?: boolean | null;
    wouldRecommend?: boolean | null;
    text: string;
    visitDate: string;
    tags: ReviewTag[];
    photoUris: string[];
    dishes: {
      name: string;
      rating: number;
      ratingValue?: number;
      ratingMax?: number;
      normalizedRating?: number;
      notes: string;
      photoUrl: string | null;
      isBestDish: boolean;
    }[];
    comparison?: {
      comparedRestaurantId: string;
      preference: ComparisonPreference;
      reason?: string;
    };
  }
): Promise<{
  reviewId: string;
  restaurantId: string;
  review: Review;
  restaurant: Restaurant;
  dishes: Dish[];
  reviewPhotos: ReviewPhoto[];
}> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  let restaurant: Restaurant;

  if (data.restaurantId) {
    const { data: row, error } = await supabase.from("restaurants").select("*").eq("id", data.restaurantId).single();
    if (error || !row) throw new Error("Restaurant not found");
    restaurant = mapRestaurant(row);
  } else if (data.place) {
    restaurant = await findOrCreateRestaurantFromPlace(data.place);
  } else {
    const { data: row, error: restError } = await supabase
      .from("restaurants")
      .insert({
        name: data.restaurantName!,
        address: data.address ?? "",
        city: data.city ?? "",
        cuisine: data.cuisine ?? "American",
        price_level: data.priceLevel ?? 2,
        image_url: null,
      })
      .select()
      .single();
    if (restError) throw new Error(restError.message);
    restaurant = mapRestaurant(row);
  }

  const structured = buildStructuredReviewFields({
    rating: data.rating,
    categoryScores: data.categoryScores,
    ratingManualOverride: data.ratingManualOverride,
    waitTime: data.waitTime,
    wouldReturn: data.wouldReturn,
    wouldRecommend: data.wouldRecommend,
  });

  const ratingMax = data.ratingMax ?? 10;
  const ratingValue = data.ratingValue ?? structured.rating;
  const normalizedRating =
    data.normalizedRating ?? buildNormalizedRating(ratingValue, ratingMax).normalizedRating;
  const legacyRating = legacyTenPointFromNormalized(normalizedRating);
  const visibility: ReviewVisibility = data.visibility ?? "friends";

  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .insert({
      user_id: userId,
      restaurant_id: restaurant.id,
      rating: legacyRating,
      rating_value: ratingValue,
      rating_max: ratingMax,
      normalized_rating: normalizedRating,
      visibility,
      food_quality: structured.categoryScores.foodQuality,
      service_score: structured.categoryScores.service,
      atmosphere: structured.categoryScores.atmosphere,
      value_score: structured.categoryScores.value,
      rating_manual_override: structured.ratingManualOverride,
      wait_time: structured.waitTime,
      would_return: structured.wouldReturn,
      would_recommend: structured.wouldRecommend,
      text: data.text,
      visit_date: data.visitDate,
      tags: data.tags,
    })
    .select()
    .single();

  if (reviewError) throw new Error(reviewError.message);

  const dishRows = data.dishes
    .filter((d) => d.name.trim())
    .map((d) => {
      const dMax = d.ratingMax ?? ratingMax;
      const dVal = d.ratingValue ?? d.rating;
      const dNorm = d.normalizedRating ?? buildNormalizedRating(dVal, dMax).normalizedRating;
      return {
        review_id: review.id,
        restaurant_id: restaurant.id,
        user_id: userId,
        name: d.name.trim(),
        rating: legacyTenPointFromNormalized(dNorm),
        rating_value: dVal,
        rating_max: dMax,
        normalized_rating: dNorm,
        notes: d.notes,
        photo_url: d.photoUrl,
        is_best_dish: d.isBestDish,
      };
    });

  if (dishRows.length > 0) {
    const { error: dishError } = await supabase.from("dishes").insert(dishRows);
    if (dishError) throw new Error(dishError.message);
  }

  const photoUrls = (
    await Promise.all(
      data.photoUris.map(async (uri, i) => {
        try {
          return await uploadReviewPhoto(userId, review.id, uri, i);
        } catch {
          return null;
        }
      }),
    )
  ).filter((url): url is string => !!url);

  let reviewPhotos: ReviewPhoto[] = [];
  if (photoUrls.length > 0) {
    const { data: photoRows, error: photoError } = await supabase
      .from("review_photos")
      .insert(photoUrls.map((url) => ({ review_id: review.id, url, user_id: userId })))
      .select();
    if (!photoError && photoRows) {
      reviewPhotos = photoRows.map(mapReviewPhoto);
      await supabase.from("restaurants").update({ image_url: photoUrls[0] }).eq("id", restaurant.id);
      restaurant = { ...restaurant, imageUrl: photoUrls[0] };
    }
  }

  if (data.comparison?.comparedRestaurantId) {
    await supabase.from("review_comparisons").insert({
      user_id: userId,
      review_id: review.id,
      current_restaurant_id: restaurant.id,
      compared_restaurant_id: data.comparison.comparedRestaurantId,
      preference: data.comparison.preference,
      reason: data.comparison.reason ?? "",
    });
  }

  let dishes: Dish[] = [];
  if (dishRows.length > 0) {
    const { data: dishData, error: dishFetchError } = await supabase
      .from("dishes")
      .select("*")
      .eq("review_id", review.id);
    if (dishFetchError) throw new Error(dishFetchError.message);
    dishes = (dishData ?? []).map(mapDish);
  }

  return {
    reviewId: review.id,
    restaurantId: restaurant.id,
    review: mapReview(review),
    restaurant,
    dishes,
    reviewPhotos,
  };
}

export async function updateReviewDb(
  userId: string,
  reviewId: string,
  data: {
    rating: number;
    categoryScores: ReviewCategoryScores;
    ratingManualOverride?: boolean;
    waitTime?: WaitTime | null;
    wouldReturn?: boolean | null;
    wouldRecommend?: boolean | null;
    text: string;
    visitDate: string;
    tags: ReviewTag[];
  },
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const structured = buildStructuredReviewFields({
    rating: data.rating,
    categoryScores: data.categoryScores,
    ratingManualOverride: data.ratingManualOverride,
    waitTime: data.waitTime,
    wouldReturn: data.wouldReturn,
    wouldRecommend: data.wouldRecommend,
  });

  const { data: row, error } = await supabase
    .from("reviews")
    .update({
      rating: structured.rating,
      food_quality: structured.categoryScores.foodQuality,
      service_score: structured.categoryScores.service,
      atmosphere: structured.categoryScores.atmosphere,
      value_score: structured.categoryScores.value,
      rating_manual_override: structured.ratingManualOverride,
      wait_time: structured.waitTime,
      would_return: structured.wouldReturn,
      would_recommend: structured.wouldRecommend,
      text: data.text,
      visit_date: data.visitDate,
      tags: data.tags,
    })
    .eq("id", reviewId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapReview(row);
}

export async function deleteReviewDb(userId: string, reviewId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function toggleLikeDb(userId: string, reviewId: string, existingId?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  if (existingId) {
    const { error } = await supabase.from("likes").delete().eq("id", existingId);
    if (error) throw new Error(error.message);
    return null;
  }

  const { data, error } = await supabase
    .from("likes")
    .insert({ review_id: reviewId, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const [{ data: review }, { data: actor }] = await Promise.all([
    supabase.from("reviews").select("user_id").eq("id", reviewId).single(),
    supabase.from("users").select("display_name").eq("id", userId).single(),
  ]);
  if (review && review.user_id !== userId) {
    await createNotification({
      userId: review.user_id,
      actorId: userId,
      type: "like",
      reviewId,
      message: `${actor?.display_name ?? "Someone"} liked your review`,
    });
  }

  return mapLike(data);
}

export async function addCommentDb(userId: string, reviewId: string, text: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("comments")
    .insert({ review_id: reviewId, user_id: userId, text: text.trim() })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const [{ data: review }, { data: actor }] = await Promise.all([
    supabase.from("reviews").select("user_id").eq("id", reviewId).single(),
    supabase.from("users").select("display_name").eq("id", userId).single(),
  ]);
  if (review && review.user_id !== userId) {
    await createNotification({
      userId: review.user_id,
      actorId: userId,
      type: "comment",
      reviewId,
      message: `${actor?.display_name ?? "Someone"} commented on your review`,
    });
  }

  return mapComment(data);
}

export async function toggleFollowDb(userId: string, targetId: string, existingId?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  if (existingId) {
    const { error } = await supabase.from("follows").delete().eq("id", existingId);
    if (error) throw new Error(error.message);
    return null;
  }

  const { data, error } = await supabase
    .from("follows")
    .insert({ follower_id: userId, following_id: targetId })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { data: actor } = await supabase.from("users").select("display_name").eq("id", userId).single();
  await createNotification({
    userId: targetId,
    actorId: userId,
    type: "follow",
    message: `${actor?.display_name ?? "Someone"} started following you`,
  });

  return mapFollow(data);
}

export function subscribeToAuth(callback: (userId: string | null) => void) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user?.id ?? null);
  });

  return () => subscription.unsubscribe();
}

export function subscribeToNotifications(userId: string, onInsert: (n: AppNotification) => void) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onInsert(mapNotification(payload.new as Parameters<typeof mapNotification>[0]))
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
