import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PlaceResult } from "@/lib/places/types";
import type {
  ComparisonPreference,
  Cuisine,
  PriceLevel,
  ReviewCategoryScores,
  ReviewTag,
  ReviewVisibility,
  WaitTime,
} from "@/lib/types";
import { DEFAULT_CATEGORY_SCORES } from "@/lib/review-scores";

export type AddBiteMode = "entry" | "bites_only" | "review" | "success";

export type AddBiteStep =
  | "restaurant"
  | "rating"
  | "review"
  | "photos_dishes"
  | "compare"
  | "visibility"
  | "preview";

export const ADD_BITE_STEPS: AddBiteStep[] = [
  "restaurant",
  "rating",
  "review",
  "photos_dishes",
  "compare",
  "visibility",
  "preview",
];

export const ADD_BITE_STEP_LABELS = [
  "Restaurant",
  "Rating",
  "Review",
  "Photos",
  "Compare",
  "Visibility",
  "Preview",
];

/** v1 launch: Bites-only vs friends — Public hidden until needed. */
export type AddBiteLaunchVisibility = "private" | "friends";

export const ADD_BITE_VISIBILITY_OPTIONS: ReadonlyArray<{
  key: AddBiteLaunchVisibility;
  title: string;
  body: string;
}> = [
  {
    key: "private",
    title: "Only in my Bites",
    body: "Saved to your journal. Not on Feed. Doesn’t affect the public PickyBites rating.",
  },
  {
    key: "friends",
    title: "Share with friends",
    body: "Friends see it on Feed. Counts toward the PickyBites rating.",
  },
];

/** Shown under the rating control — private scores stay out of the community average. */
export const ADD_BITE_RATING_SCORE_HINT =
  "Your score helps build the PickyBites rating (unless you keep it private).";

export const ADD_BITE_MAX_PHOTOS = 8;
export const ADD_BITE_MAX_TEXT = 750;
/** Optional dishes on New Post — keep the list short so compose stays light. */
export const ADD_BITE_MAX_DISHES = 5;

export function coerceAddBiteVisibility(visibility: ReviewVisibility): AddBiteLaunchVisibility {
  return visibility === "private" ? "private" : "friends";
}

export function addBiteVisibilityLabel(visibility: ReviewVisibility): string {
  const key = coerceAddBiteVisibility(visibility);
  return ADD_BITE_VISIBILITY_OPTIONS.find((o) => o.key === key)?.title ?? "Share with friends";
}

export function isNewPostPrivate(visibility: ReviewVisibility): boolean {
  return coerceAddBiteVisibility(visibility) === "private";
}

/** Primary CTA on the single-screen New Post compose. */
export function newPostSubmitLabel(visibility: ReviewVisibility): string {
  return isNewPostPrivate(visibility) ? "Save to Bites" : "Share to Feed";
}

export function newPostPrivateSubcopy(isPrivate: boolean): string {
  return isPrivate ? "Only in my Bites" : "Friends see this on Feed";
}

/** Journal toggle helper copy — clarifies Feed-without-Bites when journal is off. */
export function newPostJournalSubcopy(opts: {
  saveToBites: boolean;
  isPrivate: boolean;
}): string {
  if (opts.isPrivate) return "Private posts are always saved to your journal.";
  if (opts.saveToBites) return "Also saves this visit in Bites.";
  return "Off: appears on Feed only — not saved in Bites.";
}

export type AddBiteDishDraft = {
  name: string;
  ratingValue: number;
  notes: string;
  isBestDish: boolean;
  photoUri?: string | null;
};

export function createEmptyDishDraft(ratingValue = 8): AddBiteDishDraft {
  return {
    name: "",
    ratingValue,
    notes: "",
    isBestDish: false,
    photoUri: null,
  };
}

/** Named dishes only — first named dish is marked best for rankings. */
export function dishesReadyForSubmit(dishes: AddBiteDishDraft[]): Array<{
  name: string;
  rating: number;
  ratingValue: number;
  ratingMax: number;
  notes: string;
  photoUrl: string | null;
  isBestDish: boolean;
}> {
  const named = dishes
    .map((d) => ({
      name: d.name.trim(),
      ratingValue: Math.min(10, Math.max(1, Math.round(d.ratingValue))),
      notes: d.notes.trim(),
      photoUrl: d.photoUri?.trim() ? d.photoUri.trim() : null,
    }))
    .filter((d) => d.name.length > 0);

  return named.map((d, i) => ({
    name: d.name,
    rating: d.ratingValue,
    ratingValue: d.ratingValue,
    ratingMax: 10,
    notes: d.notes,
    photoUrl: d.photoUrl,
    isBestDish: i === 0,
  }));
}

export type AddBiteDraft = {
  mode: AddBiteMode;
  step: AddBiteStep;
  restaurantId: string | null;
  place: PlaceResult | null;
  restaurantName: string;
  address: string;
  city: string;
  cuisine: Cuisine | null;
  priceLevel: PriceLevel | null;
  ratingMax: number;
  ratingValue: number;
  /** False until the user explicitly taps a 1–10 score on New Post. */
  ratingChosen: boolean;
  categoryScores: ReviewCategoryScores;
  includeCategories: boolean;
  waitTime: WaitTime | null;
  wouldReturn: boolean | null;
  wouldRecommend: boolean | null;
  text: string;
  visitDate: string;
  tags: ReviewTag[];
  photoUris: string[];
  coverPhotoIndex: number;
  dishes: AddBiteDishDraft[];
  compareRestaurantId: string | null;
  comparePreference: ComparisonPreference | null;
  compareReason: string;
  skipCompare: boolean;
  visibility: ReviewVisibility;
  saveToBites: boolean;
  bitesNote: string;
  idempotencyKey: string;
};

export function createEmptyDraft(): AddBiteDraft {
  const today = new Date().toISOString().slice(0, 10);
  return {
    mode: "entry",
    step: "restaurant",
    restaurantId: null,
    place: null,
    restaurantName: "",
    address: "",
    city: "",
    cuisine: null,
    priceLevel: null,
    ratingMax: 10,
    ratingValue: 8,
    ratingChosen: false,
    categoryScores: { ...DEFAULT_CATEGORY_SCORES },
    includeCategories: false,
    waitTime: null,
    wouldReturn: null,
    wouldRecommend: null,
    text: "",
    visitDate: today,
    tags: [],
    photoUris: [],
    coverPhotoIndex: 0,
    dishes: [],
    compareRestaurantId: null,
    comparePreference: null,
    compareReason: "",
    skipCompare: true,
    visibility: "friends",
    saveToBites: true,
    bitesNote: "",
    idempotencyKey: `bite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

export function draftIsPopulated(draft: AddBiteDraft): boolean {
  return !!(
    draft.restaurantId ||
    draft.place ||
    draft.restaurantName.trim() ||
    draft.text.trim() ||
    draft.photoUris.length ||
    draft.dishes.some((d) => d.name.trim())
  );
}

const key = (userId: string) => `@pickybites/add_bite_draft/${userId}`;

export async function loadAddBiteDraft(userId: string): Promise<AddBiteDraft | null> {
  const raw = await AsyncStorage.getItem(key(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AddBiteDraft>;
    const draft = { ...createEmptyDraft(), ...parsed };
    draft.visibility = coerceAddBiteVisibility(draft.visibility);
    // Legacy drafts lacked ratingChosen — treat populated drafts as already chosen.
    if (typeof parsed.ratingChosen !== "boolean") {
      draft.ratingChosen = draftIsPopulated(draft);
    }
    return draft;
  } catch {
    return null;
  }
}

export async function saveAddBiteDraft(userId: string, draft: AddBiteDraft): Promise<void> {
  await AsyncStorage.setItem(key(userId), JSON.stringify(draft));
}

export async function clearAddBiteDraft(userId: string): Promise<void> {
  await AsyncStorage.removeItem(key(userId));
}

export function stepIndex(step: AddBiteStep): number {
  return ADD_BITE_STEPS.indexOf(step);
}

/**
 * Legacy wizard progress (kept for older drafts/tests).
 * New Post is a single compose screen — prefer not using this in UI.
 */
export function addBiteDisplayProgress(step: AddBiteStep): { step: number; total: number } {
  const idx = stepIndex(step);
  if (idx < 0) return { step: 1, total: 6 };
  const display = Math.min(idx + 1, 6);
  return { step: display, total: 6 };
}

/** Default draft for center + — single-screen New Post compose. */
export function createReviewDraft(): AddBiteDraft {
  return {
    ...createEmptyDraft(),
    mode: "review",
    step: "restaurant",
    skipCompare: true,
    visibility: "friends",
    saveToBites: true,
    ratingChosen: false,
  };
}

/** True once the user taps a 1–10 score (defaults are not treated as chosen). */
export function hasChosenNewPostRating(draft: Pick<AddBiteDraft, "ratingChosen">): boolean {
  return draft.ratingChosen === true;
}
