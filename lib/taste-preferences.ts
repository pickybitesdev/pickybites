import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSupabase } from "./supabase/client";
import type { PriceLevel } from "./types";

export type DietPreference = "None" | "Vegetarian" | "Vegan" | "Pescatarian" | "Gluten-Free";

export type FoodGoal =
  | "Try new cuisines"
  | "Find hidden gems"
  | "Date night spots"
  | "Eat healthier"
  | "Budget-friendly"
  | "Fine dining";

export type TastePreferences = {
  dietPreferences: DietPreference[];
  budgetRange: PriceLevel | null;
  favoriteRestaurant: string;
  foodGoals: FoodGoal[];
};

export const DIET_OPTIONS: DietPreference[] = ["None", "Vegetarian", "Vegan", "Pescatarian", "Gluten-Free"];

export const FOOD_GOAL_OPTIONS: FoodGoal[] = [
  "Try new cuisines",
  "Find hidden gems",
  "Date night spots",
  "Eat healthier",
  "Budget-friendly",
  "Fine dining",
];

export const BUDGET_OPTIONS: { label: string; value: PriceLevel }[] = [
  { label: "$", value: 1 },
  { label: "$$", value: 2 },
  { label: "$$$", value: 3 },
  { label: "$$$$", value: 4 },
];

const key = (userId: string) => `@pickybites/taste_prefs/${userId}`;

const DIET_SET = new Set<string>(DIET_OPTIONS);
const GOAL_SET = new Set<string>(FOOD_GOAL_OPTIONS);

function coerceBudget(value: unknown): PriceLevel | null {
  const n = typeof value === "number" ? value : Number(value);
  return n === 1 || n === 2 || n === 3 || n === 4 ? (n as PriceLevel) : null;
}

/** Narrow raw string arrays from the DB back into the app's unions. */
function rowToPreferences(row: {
  diet_preferences?: string[] | null;
  budget_range?: number | null;
  favorite_restaurant?: string | null;
  food_goals?: string[] | null;
}): TastePreferences {
  const diet = (row.diet_preferences ?? []).filter((d): d is DietPreference => DIET_SET.has(d));
  return {
    dietPreferences: diet.length ? diet : ["None"],
    budgetRange: coerceBudget(row.budget_range),
    favoriteRestaurant: row.favorite_restaurant ?? "",
    foodGoals: (row.food_goals ?? []).filter((g): g is FoodGoal => GOAL_SET.has(g)),
  };
}

async function readLocal(userId: string): Promise<TastePreferences | null> {
  const raw = await AsyncStorage.getItem(key(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TastePreferences;
  } catch {
    return null;
  }
}

/**
 * Load preferences, server first. AsyncStorage is only a cache so the quiz
 * answers survive reinstalls and follow the user to a new device.
 */
export async function loadTastePreferences(userId: string): Promise<TastePreferences | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("diet_preferences, budget_range, favorite_restaurant, food_goals")
        .eq("id", userId)
        .maybeSingle();
      if (!error && data) {
        const prefs = rowToPreferences(data);
        await AsyncStorage.setItem(key(userId), JSON.stringify(prefs));
        return prefs;
      }
    } catch {
      // Fall through to the cached copy when offline.
    }
  }
  return readLocal(userId);
}

export async function saveTastePreferences(
  userId: string,
  prefs: TastePreferences,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Write the cache first so the UI stays correct even if the network fails.
  await AsyncStorage.setItem(key(userId), JSON.stringify(prefs));

  const supabase = getSupabase();
  if (!supabase) return { ok: true };

  try {
    const { error } = await supabase
      .from("users")
      .update({
        diet_preferences: prefs.dietPreferences,
        budget_range: prefs.budgetRange,
        favorite_restaurant: prefs.favoriteRestaurant,
        food_goals: prefs.foodGoals,
      })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save preferences" };
  }
}
