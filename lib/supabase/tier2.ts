import { getSupabase } from "./client";
import { mapBookmark, mapFavorite } from "./mappers";
import type { Bookmark, BucketListStatus, Favorite } from "@/lib/types";
import type { PlaceResult } from "@/lib/places/types";

export async function fetchBookmarks(userId: string): Promise<Bookmark[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapBookmark);
}

export async function addBookmarkDb(
  userId: string,
  place: PlaceResult,
  reason = "Saved from Discover",
): Promise<Bookmark> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: userId,
      google_place_id: place.googlePlaceId,
      place_name: place.name,
      place_address: place.address,
      place_city: place.city,
      place_cuisine: place.cuisine,
      place_image_url: place.imageUrl,
      place_price_level: place.priceLevel,
      latitude: place.latitude,
      longitude: place.longitude,
      status: "want_to_try",
      notes: reason,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapBookmark(data);
}

export async function removeBookmarkDb(bookmarkId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("bookmarks").delete().eq("id", bookmarkId);
  if (error) throw new Error(error.message);
}

export async function addBookmarkFromRestaurantDb(
  userId: string,
  restaurant: {
    id: string;
    googlePlaceId?: string | null;
    name: string;
    address: string;
    city: string;
    cuisine: string;
    priceLevel?: number;
    imageUrl: string | null;
    latitude?: number | null;
    longitude?: number | null;
  },
  reason = "Saved to bucket list",
): Promise<Bookmark> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const googlePlaceId = restaurant.googlePlaceId ?? `restaurant:${restaurant.id}`;

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: userId,
      restaurant_id: restaurant.id,
      google_place_id: googlePlaceId,
      place_name: restaurant.name,
      place_address: restaurant.address,
      place_city: restaurant.city,
      place_cuisine: restaurant.cuisine,
      place_image_url: restaurant.imageUrl,
      place_price_level: restaurant.priceLevel,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      status: "want_to_try",
      notes: reason,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapBookmark(data);
}

export async function updateBookmarkDb(
  bookmarkId: string,
  patch: {
    status?: BucketListStatus;
    reasonSaved?: string;
    plannedAt?: string | null;
    visitedAt?: string | null;
    restaurantId?: string | null;
  },
): Promise<Bookmark> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status) payload.status = patch.status;
  if (patch.reasonSaved != null) payload.notes = patch.reasonSaved;
  if (patch.plannedAt !== undefined) payload.planned_at = patch.plannedAt;
  if (patch.visitedAt !== undefined) payload.visited_at = patch.visitedAt;
  if (patch.restaurantId !== undefined) payload.restaurant_id = patch.restaurantId;

  const { data, error } = await supabase
    .from("bookmarks")
    .update(payload)
    .eq("id", bookmarkId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapBookmark(data);
}

export async function removeBookmarkByPlaceIdDb(userId: string, googlePlaceId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("google_place_id", googlePlaceId);
  if (error) throw new Error(error.message);
}

export async function fetchFavorites(userId: string): Promise<Favorite[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("favorites") || m.includes("does not exist") || m.includes("schema cache")) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data ?? []).map(mapFavorite);
}

export async function addRestaurantFavorite(userId: string, restaurantId: string): Promise<Favorite> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, restaurant_id: restaurantId, dish_id: null })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapFavorite(data);
}

export async function addDishFavorite(userId: string, dishId: string): Promise<Favorite> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, restaurant_id: null, dish_id: dishId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapFavorite(data);
}

export async function removeFavorite(favoriteId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("favorites").delete().eq("id", favoriteId);
  if (error) throw new Error(error.message);
}
