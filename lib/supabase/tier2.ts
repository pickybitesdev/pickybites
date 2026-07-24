import { getSupabase } from "./client";
import { mapBookmark, mapFavorite, mapSavedItemSource } from "./mappers";
import type {
  Bookmark,
  BookmarkCreatedVia,
  BookmarkResolutionStatus,
  BucketListStatus,
  Favorite,
  SavedItemSource,
  ShareSourcePlatform,
} from "@/lib/types";
import type { PlaceResult } from "@/lib/places/types";

export async function fetchBookmarks(userId: string): Promise<Bookmark[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*, saved_item_sources(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    // Fallback if sources table not migrated yet
    const fallback = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (fallback.error) throw new Error(fallback.error.message);
    return (fallback.data ?? []).map(mapBookmark);
  }
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
      created_via: "discover",
      resolution_status: "linked",
    })
    .select("*, saved_item_sources(*)")
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
      created_via: "restaurant",
      resolution_status: "linked",
    })
    .select("*, saved_item_sources(*)")
    .single();

  if (error) throw new Error(error.message);
  return mapBookmark(data);
}

export type ShareSourceInput = {
  sourceUrl: string;
  canonicalUrl: string;
  sourcePlatform: ShareSourcePlatform;
  title?: string | null;
  thumbnailUrl?: string | null;
};

export async function addSavedItemSourceDb(
  userId: string,
  bookmarkId: string,
  source: ShareSourceInput,
): Promise<SavedItemSource> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("saved_item_sources")
    .upsert(
      {
        user_id: userId,
        saved_restaurant_id: bookmarkId,
        source_url: source.sourceUrl,
        canonical_url: source.canonicalUrl,
        source_platform: source.sourcePlatform,
        title: source.title ?? null,
        thumbnail_url: source.thumbnailUrl ?? null,
      },
      { onConflict: "user_id,canonical_url" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapSavedItemSource(data);
}

export async function removeSavedItemSourceDb(sourceId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("saved_item_sources").delete().eq("id", sourceId);
  if (error) throw new Error(error.message);
}

export async function saveShareBookmarkDb(opts: {
  userId: string;
  placeName: string;
  placeAddress?: string;
  placeCity?: string;
  placeCuisine?: string | null;
  placeImageUrl?: string | null;
  placePriceLevel?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
  restaurantId?: string | null;
  note?: string | null;
  createdVia?: BookmarkCreatedVia;
  resolutionStatus: BookmarkResolutionStatus;
  sourcePlatform: ShareSourcePlatform;
  sourceTitle?: string | null;
  sourceThumbnailUrl?: string | null;
  source: ShareSourceInput;
}): Promise<{ bookmark: Bookmark; alreadyExisted: boolean }> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  let existing: Bookmark | null = null;
  if (opts.googlePlaceId) {
    const { data } = await supabase
      .from("bookmarks")
      .select("*, saved_item_sources(*)")
      .eq("user_id", opts.userId)
      .eq("google_place_id", opts.googlePlaceId)
      .maybeSingle();
    if (data) existing = mapBookmark(data);
  }
  if (!existing && opts.restaurantId) {
    const { data } = await supabase
      .from("bookmarks")
      .select("*, saved_item_sources(*)")
      .eq("user_id", opts.userId)
      .eq("restaurant_id", opts.restaurantId)
      .maybeSingle();
    if (data) existing = mapBookmark(data);
  }

  if (existing) {
    await addSavedItemSourceDb(opts.userId, existing.id, opts.source);
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      source_platform: opts.sourcePlatform,
      primary_source_title: opts.sourceTitle ?? existing.primarySourceTitle,
      primary_source_thumbnail_url:
        opts.sourceThumbnailUrl ?? existing.primarySourceThumbnailUrl,
    };
    if (!existing.reasonSaved || existing.reasonSaved === "Saved to bucket list") {
      if (opts.note?.trim()) patch.notes = opts.note.trim();
    }
    const { data, error } = await supabase
      .from("bookmarks")
      .update(patch)
      .eq("id", existing.id)
      .select("*, saved_item_sources(*)")
      .single();
    if (error) throw new Error(error.message);
    return { bookmark: mapBookmark(data), alreadyExisted: true };
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: opts.userId,
      restaurant_id: opts.restaurantId ?? null,
      google_place_id: opts.googlePlaceId ?? null,
      place_name: opts.placeName,
      place_address: opts.placeAddress ?? "",
      place_city: opts.placeCity ?? "",
      place_cuisine: opts.placeCuisine ?? null,
      place_image_url: opts.placeImageUrl ?? null,
      place_price_level: opts.placePriceLevel ?? null,
      latitude: opts.latitude ?? null,
      longitude: opts.longitude ?? null,
      status: "want_to_try",
      notes: opts.note?.trim() || `Saved from ${opts.sourcePlatform}`,
      created_via: opts.createdVia ?? "share_extension",
      resolution_status: opts.resolutionStatus,
      source_platform: opts.sourcePlatform,
      primary_source_title: opts.sourceTitle ?? null,
      primary_source_thumbnail_url: opts.sourceThumbnailUrl ?? null,
    })
    .select("*, saved_item_sources(*)")
    .single();

  if (error) throw new Error(error.message);
  const bookmark = mapBookmark(data);
  await addSavedItemSourceDb(opts.userId, bookmark.id, opts.source);
  const refreshed = await supabase
    .from("bookmarks")
    .select("*, saved_item_sources(*)")
    .eq("id", bookmark.id)
    .single();
  return {
    bookmark: refreshed.data ? mapBookmark(refreshed.data) : bookmark,
    alreadyExisted: false,
  };
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
