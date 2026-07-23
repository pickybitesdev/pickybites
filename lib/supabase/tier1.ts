import { getSupabase } from "./client";
import {
  mapList, mapListItem, mapDish, mapNotification, mapListCollaborator,
} from "./mappers";
import { APP_SCHEME } from "@/constants/branding";
import type { AppNotification, Cuisine, Dish, List, ListItem, ListCollaborator, NotificationType } from "@/lib/types";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function resetPassword(email: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${APP_SCHEME}://reset-password`,
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(newPassword: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

// ─── Taste quiz ───────────────────────────────────────────────────────────────

export async function saveTasteQuiz(userId: string, cuisines: Cuisine[]) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("users").update({
    favorite_cuisines: cuisines,
    has_completed_taste_quiz: true,
  }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function savePushToken(userId: string, token: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("users").update({ push_token: token }).eq("id", userId);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapNotification);
}

export async function markNotificationsRead(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}

export async function createNotification(params: {
  userId: string;
  actorId: string;
  type: NotificationType;
  reviewId?: string;
  message: string;
}) {
  if (params.userId === params.actorId) return;
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("notifications").insert({
    user_id: params.userId,
    actor_id: params.actorId,
    type: params.type,
    review_id: params.reviewId ?? null,
    message: params.message,
  });
}

// ─── Lists ────────────────────────────────────────────────────────────────────

export async function createListDb(userId: string, name: string, description: string): Promise<List> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("lists")
    .insert({ user_id: userId, name: name.trim(), description: description.trim(), is_public: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapList(data);
}

export async function deleteListDb(listId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  await supabase.from("list_items").delete().eq("list_id", listId);
  const { error } = await supabase.from("lists").delete().eq("id", listId);
  if (error) throw new Error(error.message);
}

export async function addListItemDb(listId: string, restaurantId: string, note: string, position: number): Promise<ListItem> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("list_items")
    .insert({ list_id: listId, restaurant_id: restaurantId, note, position })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapListItem(data);
}

export async function removeListItemDb(itemId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("list_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
}

export async function inviteListCollaboratorDb(listId: string, userId: string): Promise<ListCollaborator> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("list_collaborators")
    .insert({ list_id: listId, user_id: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapListCollaborator(data);
}

export async function removeListCollaboratorDb(collaboratorId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("list_collaborators").delete().eq("id", collaboratorId);
  if (error) throw new Error(error.message);
}

// ─── Dishes ───────────────────────────────────────────────────────────────────

export async function addDishDb(
  userId: string,
  reviewId: string,
  dish: { name: string; rating: number; notes: string; isBestDish: boolean }
): Promise<Dish> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: review, error: revErr } = await supabase
    .from("reviews")
    .select("restaurant_id")
    .eq("id", reviewId)
    .eq("user_id", userId)
    .single();
  if (revErr || !review) throw new Error("Review not found");

  const { data, error } = await supabase
    .from("dishes")
    .insert({
      review_id: reviewId,
      restaurant_id: review.restaurant_id,
      name: dish.name.trim(),
      rating: dish.rating,
      rating_value: dish.rating,
      rating_max: 10,
      normalized_rating: Math.min(100, Math.max(0, dish.rating * 10)),
      notes: dish.notes,
      is_best_dish: dish.isBestDish,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapDish(data);
}

