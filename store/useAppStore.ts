import { create } from "zustand";
import {
  DEMO_EMAIL,
  MOCK_COMMENTS, MOCK_DISHES, MOCK_FOLLOWS,
  MOCK_LIKES, MOCK_LIST_ITEMS, MOCK_LISTS, MOCK_RESTAURANTS,
  MOCK_REVIEW_PHOTOS, MOCK_REVIEWS, MOCK_USERS,
} from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import * as supabaseApi from "@/lib/supabase/api";
import { uploadAvatar } from "@/lib/supabase/storage";
import type { PlaceResult } from "@/lib/places/types";
import * as tier1 from "@/lib/supabase/tier1";
import { registerForPushNotifications, showLocalNotification } from "@/lib/push";
import * as tier2 from "@/lib/supabase/tier2";
import type { Comment, Cuisine, Dish, Follow, Like, List, ListItem, ListCollaborator, Restaurant, Review, ReviewPhoto, ReviewTag, ReviewCategoryScores, WaitTime, User, AppNotification, Bookmark, Favorite, ReviewVisibility, ComparisonPreference } from "@/lib/types";
import { APP_NAME } from "@/constants/branding";
import { validateReviewSubmit } from "@/lib/review-validation";
import { buildStructuredReviewFields } from "@/lib/review-scores";
import { buildNormalizedRating, legacyTenPointFromNormalized } from "@/lib/rating-scale";
import { generateId } from "@/lib/utils";
import { loadHasSeenOnboarding, saveHasSeenOnboarding } from "@/lib/prefs";
import { isDishFavorited, isRestaurantFavorited } from "@/lib/favorites";

export type AuthResult = { ok: true } | { ok: false; error: string };

interface AppState {
  hasSeenOnboarding: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  useSupabase: boolean;
  currentUserId: string | null;
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
  isRefreshing: boolean;
  isDataLoaded: boolean;
  feedVersion: number;
  initialize: () => Promise<void>;
  completeOnboarding: () => void;
  login: (email: string, password: string) => Promise<AuthResult>;
  demoLogin: () => Promise<AuthResult>;
  signup: (data: { email: string; password: string; username: string; displayName: string; city: string }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  loadData: () => Promise<void>;
  ensureRestaurantFromPlace: (place: PlaceResult) => Promise<Restaurant | { error: string }>;
  updateProfile: (updates: Partial<User> & { avatarLocalUri?: string }) => Promise<AuthResult>;
  addReview: (data: {
    restaurantId?: string;
    place?: PlaceResult;
    restaurantName?: string;
    address?: string;
    city?: string;
    cuisine?: Restaurant["cuisine"];
    priceLevel?: Restaurant["priceLevel"];
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
    photoUris?: string[];
    dishes: (Omit<
      Dish,
      "id" | "reviewId" | "restaurantId" | "createdAt" | "ratingValue" | "ratingMax" | "normalizedRating"
    > & {
      ratingValue?: number;
      ratingMax?: number;
      normalizedRating?: number;
    })[];
    comparison?: {
      comparedRestaurantId: string;
      preference: ComparisonPreference;
      reason?: string;
    };
    saveToBites?: boolean;
  }) => Promise<{ reviewId: string; restaurantId: string } | { error: string }>;
  updateReview: (
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
  ) => Promise<{ ok: true } | { error: string }>;
  deleteReview: (reviewId: string) => Promise<{ ok: true } | { error: string }>;
  toggleLike: (reviewId: string) => Promise<void>;
  addComment: (reviewId: string, text: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
  getUser: (id: string) => User | undefined;
  getRestaurant: (id: string) => Restaurant | undefined;
  getReview: (id: string) => Review | undefined;
  getDish: (id: string) => Dish | undefined;
  getReviewPhoto: (reviewId: string) => ReviewPhoto | undefined;
  getReviewPhotos: (reviewId: string) => ReviewPhoto[];
  isFollowing: (id: string) => boolean;
  isLiked: (reviewId: string) => boolean;
  likeCount: (reviewId: string) => number;
  getComments: (reviewId: string) => Comment[];
  unreadNotificationCount: () => number;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  completeTasteQuiz: (cuisines: Cuisine[]) => Promise<AuthResult>;
  registerPush: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  createList: (name: string, description: string) => Promise<{ listId: string } | { error: string }>;
  deleteList: (listId: string) => Promise<void>;
  addListItem: (listId: string, restaurantId: string, note?: string) => Promise<AuthResult>;
  removeListItem: (itemId: string) => Promise<void>;
  getMyLists: () => List[];
  canEditList: (listId: string) => boolean;
  getListCollaborators: (listId: string) => ListCollaborator[];
  inviteListCollaborator: (listId: string, userId: string) => Promise<AuthResult>;
  removeListCollaborator: (collaboratorId: string) => Promise<void>;
  addDish: (reviewId: string, dish: { name: string; rating: number; notes: string; isBestDish: boolean }) => Promise<{ dishId: string } | { error: string }>;
  toggleBookmark: (place: PlaceResult) => Promise<AuthResult>;
  toggleRestaurantBookmark: (restaurant: Restaurant) => Promise<AuthResult>;
  isBookmarked: (googlePlaceId: string) => boolean;
  isRestaurantBookmarked: (restaurant: Restaurant) => boolean;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  updateBookmarkStatus: (
    bookmarkId: string,
    status: Bookmark["status"],
    opts?: { plannedAt?: string; visitedAt?: string; restaurantId?: string | null },
  ) => Promise<{ ok: true; restaurantId: string | null } | { ok: false; error: string }>;
  saveShareToTryNext: (opts: {
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
    linkOnly?: boolean;
    sourcePlatform: import("@/lib/types").ShareSourcePlatform;
    sourceUrl: string;
    canonicalUrl: string;
    sourceTitle?: string | null;
    sourceThumbnailUrl?: string | null;
  }) => Promise<
    | { ok: true; bookmark: Bookmark; alreadyExisted: boolean }
    | { ok: false; error: string }
  >;
  removeSavedSource: (sourceId: string, bookmarkId: string) => Promise<AuthResult>;
  updateReviewVisibility: (reviewId: string, visibility: ReviewVisibility) => Promise<AuthResult>;
  toggleRestaurantFavorite: (restaurantId: string) => Promise<AuthResult>;
  toggleDishFavorite: (dishId: string) => Promise<AuthResult>;
  isRestaurantFavorite: (restaurantId: string) => boolean;
  isDishFavorite: (dishId: string) => boolean;
}

function mockDataState() {
  return {
    users: MOCK_USERS,
    restaurants: MOCK_RESTAURANTS,
    reviews: MOCK_REVIEWS,
    dishes: MOCK_DISHES,
    likes: MOCK_LIKES,
    comments: MOCK_COMMENTS,
    follows: MOCK_FOLLOWS,
    lists: MOCK_LISTS,
    listItems: MOCK_LIST_ITEMS,
    listCollaborators: [] as ListCollaborator[],
    reviewPhotos: MOCK_REVIEW_PHOTOS,
    notifications: [] as AppNotification[],
    bookmarks: [] as Bookmark[],
    favorites: [] as Favorite[],
  };
}

function emptyDataState() {
  return {
    users: [] as User[],
    restaurants: [] as Restaurant[],
    reviews: [] as Review[],
    dishes: [] as Dish[],
    likes: [] as Like[],
    comments: [] as Comment[],
    follows: [] as Follow[],
    lists: [] as List[],
    listItems: [] as ListItem[],
    listCollaborators: [] as ListCollaborator[],
    reviewPhotos: [] as ReviewPhoto[],
    notifications: [] as AppNotification[],
    bookmarks: [] as Bookmark[],
    favorites: [] as Favorite[],
  };
}

let notificationUnsub: (() => void) | null = null;
let authUnsub: (() => void) | null = null;
let initStarted = false;

function setupNotificationListener(userId: string) {
  notificationUnsub?.();
  notificationUnsub = supabaseApi.subscribeToNotifications(userId, (notification) => {
    showLocalNotification(APP_NAME, notification.message);
    useAppStore.setState((s) => ({
      notifications: [notification, ...s.notifications.filter((n) => n.id !== notification.id)],
    }));
  });
}

export const useAppStore = create<AppState>((set, get) => ({
  hasSeenOnboarding: false,
  isAuthenticated: false,
  isInitializing: true,
  useSupabase: isSupabaseConfigured(),
  currentUserId: null,
  ...emptyDataState(),
  isRefreshing: false,
  isDataLoaded: false,
  feedVersion: 0,

  unreadNotificationCount: () => get().notifications.filter((n) => !n.read).length,

  initialize: async () => {
    if (initStarted) return;
    initStarted = true;

    const useSupabase = isSupabaseConfigured();
    set({ useSupabase, isInitializing: true, isDataLoaded: !useSupabase });

    if (!useSupabase) {
      set({ isInitializing: false, ...mockDataState() });
      return;
    }

    try {
      const seenOnboarding = await loadHasSeenOnboarding();
      if (seenOnboarding) set({ hasSeenOnboarding: true });

      const userId = await supabaseApi.getSessionUserId();
      if (userId) {
        set({ isAuthenticated: true, currentUserId: userId });
        try {
          const data = await supabaseApi.fetchAllData(userId);
          set({ ...data, isDataLoaded: true });
          setupNotificationListener(userId);
          get().registerPush();
        } catch (e) {
          console.error("Initial data load failed:", e);
          set({ isDataLoaded: true });
        }
      } else {
        set({ isDataLoaded: true });
      }
    } catch (e) {
      console.error("Init failed:", e);
      set({ isDataLoaded: true });
    } finally {
      set({ isInitializing: false });
    }

    authUnsub?.();
    authUnsub = supabaseApi.subscribeToAuth(async (userId) => {
      // Local mock demo ignores remote auth events (e.g. signOut after Try Demo).
      if (!get().useSupabase) return;

      if (!userId) {
        notificationUnsub?.();
        notificationUnsub = null;
        set({ isAuthenticated: false, currentUserId: null, isDataLoaded: false, ...emptyDataState() });
        return;
      }
      if (get().currentUserId !== userId) {
        set({ isAuthenticated: true, currentUserId: userId, isDataLoaded: false });
        setupNotificationListener(userId);
        await get().loadData();
        set({ isDataLoaded: true });
        get().registerPush();
      }
    });
  },

  completeOnboarding: () => {
    saveHasSeenOnboarding();
    set({ hasSeenOnboarding: true });
  },

  loadData: async () => {
    if (!get().useSupabase) return;
    const userId = get().currentUserId;
    try {
      const data = await supabaseApi.fetchAllData(userId);
      set({ ...data, isDataLoaded: true });
    } catch (e) {
      console.error("Load data failed:", e);
    }
  },

  ensureRestaurantFromPlace: async (place) => {
    const existing = get().restaurants.find((r) => r.googlePlaceId === place.googlePlaceId);
    if (existing) return existing;

    if (get().useSupabase) {
      try {
        const restaurant = await supabaseApi.findOrCreateRestaurantFromPlace(place);
        set((s) => ({
          restaurants: s.restaurants.some((r) => r.id === restaurant.id)
            ? s.restaurants
            : [restaurant, ...s.restaurants],
        }));
        return restaurant;
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Could not save restaurant" };
      }
    }

    const restaurant: Restaurant = {
      id: generateId("rest"),
      googlePlaceId: place.googlePlaceId,
      name: place.name,
      address: place.address,
      city: place.city,
      cuisine: place.cuisine,
      priceLevel: place.priceLevel,
      imageUrl: place.imageUrl,
      latitude: place.latitude,
      longitude: place.longitude,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ restaurants: [restaurant, ...s.restaurants] }));
    return restaurant;
  },

  login: async (email, password) => {
    if (!get().useSupabase) {
      const user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!user) return { ok: false, error: "Invalid email. Try alex@example.com" };
      set({ isAuthenticated: true, currentUserId: user.id });
      return { ok: true };
    }
    try {
      const userId = await supabaseApi.signIn(email, password);
      const data = await supabaseApi.fetchAllData(userId);
      set({ isAuthenticated: true, currentUserId: userId, ...data, isDataLoaded: true });
      setupNotificationListener(userId);
      get().registerPush();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Login failed" };
    }
  },

  demoLogin: async () => {
    const user = MOCK_USERS.find((u) => u.email === DEMO_EMAIL);
    if (!user) return { ok: false, error: "Demo user not found" };

    // Always use local mock data for Try Demo so Profile/Feed work without a
    // seeded Supabase project or working Places keys.
    notificationUnsub?.();
    notificationUnsub = null;
    set({
      hasSeenOnboarding: true,
      useSupabase: false,
      isAuthenticated: true,
      currentUserId: user.id,
      isDataLoaded: true,
      ...mockDataState(),
    });

    // Drop any remote session; auth listener no-ops while useSupabase is false.
    if (isSupabaseConfigured()) {
      try {
        await supabaseApi.signOut();
      } catch {
        // ignore — demo is local-only
      }
    }
    return { ok: true };
  },

  signup: async (data) => {
    if (!get().useSupabase) {
      if (get().users.some((u) => u.email === data.email || u.username === data.username)) {
        return { ok: false, error: "Email or username already taken." };
      }
      const user: User = {
        id: generateId("user"), email: data.email, username: data.username,
        displayName: data.displayName, avatarUrl: null, city: data.city, bio: "",
        favoriteCuisines: [], hasCompletedTasteQuiz: false,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({ users: [...s.users, user], isAuthenticated: true, currentUserId: user.id }));
      return { ok: true };
    }
    try {
      const userId = await supabaseApi.signUp(data);
      const allData = await supabaseApi.fetchAllData(userId);
      set({ isAuthenticated: true, currentUserId: userId, ...allData, isDataLoaded: true });
      if (userId) {
        setupNotificationListener(userId);
        get().registerPush();
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Signup failed" };
    }
  },

  logout: async () => {
    notificationUnsub?.();
    notificationUnsub = null;
    const wasRemote = get().useSupabase;
    if (wasRemote) await supabaseApi.signOut();
    set({
      isAuthenticated: false,
      currentUserId: null,
      useSupabase: isSupabaseConfigured(),
      isDataLoaded: true,
      ...emptyDataState(),
    });
  },

  refreshFeed: async () => {
    set({ isRefreshing: true });
    if (get().useSupabase) await get().loadData();
    set((s) => ({ isRefreshing: false, feedVersion: s.feedVersion + 1 }));
  },

  updateProfile: async (updates) => {
    const uid = get().currentUserId;
    if (!uid) return { ok: false, error: "Not signed in" };

    let avatarUrl = updates.avatarUrl;
    if (updates.avatarLocalUri && get().useSupabase) {
      const uploaded = await uploadAvatar(uid, updates.avatarLocalUri);
      if (uploaded) avatarUrl = uploaded;
    }

    const { avatarLocalUri: _, ...profileUpdates } = updates;

    if (get().useSupabase) {
      try {
        await supabaseApi.updateUserProfile(uid, { ...profileUpdates, avatarUrl });
        set((s) => ({
          users: s.users.map((u) =>
            u.id === uid ? { ...u, ...profileUpdates, avatarUrl: avatarUrl ?? u.avatarUrl } : u,
          ),
        }));
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
      }
    }

    set((s) => ({
      users: s.users.map((u) => u.id === uid ? { ...u, ...profileUpdates, avatarUrl: avatarUrl ?? u.avatarUrl } : u),
    }));
    return { ok: true };
  },

  addReview: async (data) => {
    const uid = get().currentUserId;
    if (!uid) return { error: "Not signed in" };

    const ratingMax = data.ratingMax ?? 10;
    const ratingValue = data.ratingValue ?? data.rating;
    const normalized =
      data.normalizedRating ??
      buildNormalizedRating(ratingValue, ratingMax).normalizedRating;
    const visibility = data.visibility ?? "friends";
    const legacyRating = legacyTenPointFromNormalized(normalized);

    const validation = validateReviewSubmit({
      restaurantId: data.restaurantId,
      restaurantName: data.restaurantName ?? data.place?.name,
      placeName: data.place?.name,
      rating: legacyRating,
      ratingValue,
      ratingMax,
      visibility,
      categoryScores: data.categoryScores,
      ratingManualOverride: data.ratingManualOverride,
      waitTime: data.waitTime,
      wouldReturn: data.wouldReturn,
      wouldRecommend: data.wouldRecommend,
      text: data.text,
      visitDate: data.visitDate,
      cuisine: data.cuisine ?? data.place?.cuisine,
      city: data.city ?? data.place?.city,
      priceLevel: data.priceLevel ?? data.place?.priceLevel,
      tags: data.tags,
      dishes: data.dishes.map((d) => ({
        name: d.name,
        rating: d.rating,
        ratingValue: d.ratingValue,
        ratingMax: d.ratingMax ?? ratingMax,
        notes: d.notes,
        isBestDish: d.isBestDish,
      })),
    });
    if (!validation.ok) return { error: validation.error };

    const structured = buildStructuredReviewFields({
      rating: legacyRating,
      categoryScores: data.categoryScores,
      ratingManualOverride: data.ratingManualOverride,
      waitTime: data.waitTime,
      wouldReturn: data.wouldReturn,
      wouldRecommend: data.wouldRecommend,
    });

    const markVisited = async (restaurantId: string) => {
      if (!data.saveToBites) return;
      const restaurant = get().restaurants.find((r) => r.id === restaurantId);
      if (!restaurant) return;
      const existing = get().bookmarks.find(
        (b) =>
          b.userId === uid &&
          (b.restaurantId === restaurantId ||
            (restaurant.googlePlaceId && b.googlePlaceId === restaurant.googlePlaceId)),
      );
      if (!existing) {
        await get().toggleRestaurantBookmark(restaurant);
      }
      const bookmark = get().bookmarks.find(
        (b) =>
          b.userId === uid &&
          (b.restaurantId === restaurantId ||
            (restaurant.googlePlaceId && b.googlePlaceId === restaurant.googlePlaceId)),
      );
      if (bookmark && bookmark.status !== "visited") {
        await get().updateBookmarkStatus(bookmark.id, "visited");
      }
    };

    if (get().useSupabase) {
      try {
        const result = await supabaseApi.createReview(uid, {
          ...data,
          ...structured,
          rating: legacyRating,
          ratingValue,
          ratingMax,
          normalizedRating: normalized,
          visibility,
          photoUris: data.photoUris ?? [],
        });
        set((s) => ({
          restaurants: s.restaurants.some((r) => r.id === result.restaurant.id)
            ? s.restaurants.map((r) => (r.id === result.restaurant.id ? result.restaurant : r))
            : [result.restaurant, ...s.restaurants],
          reviews: [result.review, ...s.reviews],
          dishes: [...result.dishes, ...s.dishes],
          reviewPhotos: [...result.reviewPhotos, ...s.reviewPhotos],
          isDataLoaded: true,
        }));
        await markVisited(result.restaurantId);
        return { reviewId: result.reviewId, restaurantId: result.restaurantId };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Failed to publish review" };
      }
    }

    const existingRestaurant = data.restaurantId
      ? get().restaurants.find((r) => r.id === data.restaurantId)
      : null;
    const restaurantId = existingRestaurant?.id ?? generateId("rest");
    const reviewId = generateId("rev");
    const restaurant: Restaurant = existingRestaurant ?? {
      id: restaurantId,
      name: data.restaurantName ?? data.place?.name ?? "Unknown",
      address: data.address ?? data.place?.address ?? "",
      city: data.city ?? data.place?.city ?? "",
      cuisine: data.cuisine ?? data.place?.cuisine ?? "American",
      priceLevel: data.priceLevel ?? data.place?.priceLevel ?? 2,
      imageUrl: data.place?.imageUrl ?? null,
      googlePlaceId: data.place?.googlePlaceId ?? null,
      createdAt: new Date().toISOString(),
    };
    const review: Review = {
      id: reviewId,
      userId: uid,
      restaurantId,
      ...structured,
      rating: legacyRating,
      ratingValue,
      ratingMax,
      normalizedRating: normalized,
      visibility,
      text: data.text,
      visitDate: data.visitDate,
      tags: data.tags,
      createdAt: new Date().toISOString(),
    };
    const newDishes = data.dishes.map((d) => {
      const dMax = d.ratingMax ?? ratingMax;
      const dVal = d.ratingValue ?? d.rating;
      const dNorm = d.normalizedRating ?? buildNormalizedRating(dVal, dMax).normalizedRating;
      return {
        ...d,
        rating: legacyTenPointFromNormalized(dNorm),
        ratingValue: dVal,
        ratingMax: dMax,
        normalizedRating: dNorm,
        id: generateId("dish"),
        reviewId,
        restaurantId,
        createdAt: new Date().toISOString(),
      };
    });
    set((s) => ({
      restaurants: existingRestaurant
        ? s.restaurants
        : [...s.restaurants, restaurant],
      reviews: [review, ...s.reviews],
      dishes: [...newDishes, ...s.dishes],
      reviewPhotos: [
        ...(data.photoUris ?? []).map((url, i) => ({
          id: generateId("photo"),
          reviewId,
          url,
          createdAt: new Date().toISOString(),
        })),
        ...s.reviewPhotos,
      ],
    }));
    await markVisited(restaurantId);
    return { reviewId, restaurantId };
  },

  updateReview: async (reviewId, data) => {
    const uid = get().currentUserId;
    if (!uid) return { error: "Not signed in" };
    const existing = get().reviews.find((r) => r.id === reviewId && r.userId === uid);
    if (!existing) return { error: "Review not found" };

    const structured = buildStructuredReviewFields({
      rating: data.rating,
      categoryScores: data.categoryScores,
      ratingManualOverride: data.ratingManualOverride,
      waitTime: data.waitTime,
      wouldReturn: data.wouldReturn,
      wouldRecommend: data.wouldRecommend,
    });

    if (get().useSupabase) {
      try {
        const updated = await supabaseApi.updateReviewDb(uid, reviewId, { ...data, ...structured });
        set((s) => ({
          reviews: s.reviews.map((r) => (r.id === reviewId ? updated : r)),
        }));
        return { ok: true };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Update failed" };
      }
    }

    set((s) => ({
      reviews: s.reviews.map((r) =>
        r.id === reviewId ? { ...r, ...structured, text: data.text, visitDate: data.visitDate, tags: data.tags } : r,
      ),
    }));
    return { ok: true };
  },

  deleteReview: async (reviewId) => {
    const uid = get().currentUserId;
    if (!uid) return { error: "Not signed in" };
    const existing = get().reviews.find((r) => r.id === reviewId && r.userId === uid);
    if (!existing) return { error: "Review not found" };

    if (get().useSupabase) {
      try {
        await supabaseApi.deleteReviewDb(uid, reviewId);
        set((s) => ({
          reviews: s.reviews.filter((r) => r.id !== reviewId),
          dishes: s.dishes.filter((d) => d.reviewId !== reviewId),
          likes: s.likes.filter((l) => l.reviewId !== reviewId),
          comments: s.comments.filter((c) => c.reviewId !== reviewId),
          reviewPhotos: s.reviewPhotos.filter((p) => p.reviewId !== reviewId),
        }));
        return { ok: true };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Delete failed" };
      }
    }

    set((s) => ({
      reviews: s.reviews.filter((r) => r.id !== reviewId),
      dishes: s.dishes.filter((d) => d.reviewId !== reviewId),
      likes: s.likes.filter((l) => l.reviewId !== reviewId),
      comments: s.comments.filter((c) => c.reviewId !== reviewId),
      reviewPhotos: s.reviewPhotos.filter((p) => p.reviewId !== reviewId),
    }));
    return { ok: true };
  },

  toggleLike: async (reviewId) => {
    const uid = get().currentUserId;
    if (!uid) return;
    const existing = get().likes.find((l) => l.reviewId === reviewId && l.userId === uid);
    const tempId = `opt-like-${reviewId}`;

    if (existing) {
      set((s) => ({ likes: s.likes.filter((l) => l.id !== existing.id) }));
    } else {
      set((s) => ({
        likes: [...s.likes, { id: tempId, reviewId, userId: uid, createdAt: new Date().toISOString() }],
      }));
    }

    if (get().useSupabase) {
      try {
        const result = await supabaseApi.toggleLikeDb(uid, reviewId, existing?.id);
        set((s) => {
          const likes = s.likes.filter((l) => l.id !== tempId && l.id !== existing?.id);
          if (result) return { likes: [...likes, result] };
          return { likes };
        });
      } catch (e) {
        console.error("Like failed:", e);
        set((s) => {
          let likes = s.likes.filter((l) => l.id !== tempId);
          if (existing) likes = [...likes, existing];
          return { likes };
        });
      }
      return;
    }

    if (existing) return;

    const review = get().reviews.find((r) => r.id === reviewId);
    const actor = get().getUser(uid);
    set((s) => {
      const likes = s.likes.filter((l) => l.id !== tempId).concat({
        id: generateId("like"),
        reviewId,
        userId: uid,
        createdAt: new Date().toISOString(),
      });
      const notifications =
        review && review.userId !== uid
          ? [
              {
                id: generateId("notif"),
                userId: review.userId,
                actorId: uid,
                type: "like" as const,
                reviewId,
                message: `${actor?.displayName ?? "Someone"} liked your review`,
                read: false,
                createdAt: new Date().toISOString(),
              },
              ...s.notifications,
            ]
          : s.notifications;
      return { likes, notifications };
    });
  },

  addComment: async (reviewId, text) => {
    const uid = get().currentUserId;
    if (!uid || !text.trim()) return;

    if (get().useSupabase) {
      try {
        const comment = await supabaseApi.addCommentDb(uid, reviewId, text);
        set((s) => ({ comments: [...s.comments, comment] }));
      } catch (e) {
        console.error("Comment failed:", e);
      }
      return;
    }

    const review = get().reviews.find((r) => r.id === reviewId);
    const actor = get().getUser(uid);
    set((s) => ({
      comments: [...s.comments, { id: generateId("c"), reviewId, userId: uid, text: text.trim(), createdAt: new Date().toISOString() }],
      notifications:
        review && review.userId !== uid
          ? [
              {
                id: generateId("notif"),
                userId: review.userId,
                actorId: uid,
                type: "comment" as const,
                reviewId,
                message: `${actor?.displayName ?? "Someone"} commented on your review`,
                read: false,
                createdAt: new Date().toISOString(),
              },
              ...s.notifications,
            ]
          : s.notifications,
    }));
  },

  toggleFollow: async (userId) => {
    const uid = get().currentUserId;
    if (!uid || uid === userId) return;
    const existing = get().follows.find((f) => f.followerId === uid && f.followingId === userId);
    const tempId = `opt-follow-${userId}`;

    if (existing) {
      set((s) => ({ follows: s.follows.filter((f) => f.id !== existing.id) }));
    } else {
      set((s) => ({
        follows: [...s.follows, { id: tempId, followerId: uid, followingId: userId, createdAt: new Date().toISOString() }],
      }));
    }

    if (get().useSupabase) {
      try {
        const result = await supabaseApi.toggleFollowDb(uid, userId, existing?.id);
        set((s) => {
          const follows = s.follows.filter((f) => f.id !== tempId && f.id !== existing?.id);
          if (result) return { follows: [...follows, result] };
          return { follows };
        });
      } catch (e) {
        console.error("Follow failed:", e);
        set((s) => {
          let follows = s.follows.filter((f) => f.id !== tempId);
          if (existing) follows = [...follows, existing];
          return { follows };
        });
      }
      return;
    }

    if (existing) return;

    const actor = get().getUser(uid);
    set((s) => ({
      follows: s.follows.filter((f) => f.id !== tempId).concat({
        id: generateId("f"),
        followerId: uid,
        followingId: userId,
        createdAt: new Date().toISOString(),
      }),
      notifications: [
        {
          id: generateId("notif"),
          userId,
          actorId: uid,
          type: "follow" as const,
          reviewId: null,
          message: `${actor?.displayName ?? "Someone"} started following you`,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...s.notifications,
      ],
    }));
  },

  getUser: (id) => get().users.find((u) => u.id === id),
  getRestaurant: (id) => get().restaurants.find((r) => r.id === id),
  getReview: (id) => get().reviews.find((r) => r.id === id),
  getDish: (id) => get().dishes.find((d) => d.id === id),
  getReviewPhoto: (reviewId) => get().reviewPhotos.find((p) => p.reviewId === reviewId),
  getReviewPhotos: (reviewId) => get().reviewPhotos.filter((p) => p.reviewId === reviewId),
  isFollowing: (id) => get().follows.some((f) => f.followerId === get().currentUserId && f.followingId === id),
  isLiked: (reviewId) => get().likes.some((l) => l.reviewId === reviewId && l.userId === get().currentUserId),
  likeCount: (reviewId) => get().likes.filter((l) => l.reviewId === reviewId).length,
  getComments: (reviewId) => get().comments.filter((c) => c.reviewId === reviewId),

  requestPasswordReset: async (email) => {
    if (!get().useSupabase) return { ok: true };
    try {
      await tier1.resetPassword(email);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Reset failed" };
    }
  },

  updatePassword: async (password) => {
    if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters" };
    if (!get().useSupabase) return { ok: true };
    try {
      await tier1.updatePassword(password);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
    }
  },

  completeTasteQuiz: async (cuisines) => {
    const uid = get().currentUserId;
    if (!uid) return { ok: false, error: "Not signed in" };
    if (cuisines.length < 3) return { ok: false, error: "Pick at least 3 cuisines" };

    if (get().useSupabase) {
      try {
        await tier1.saveTasteQuiz(uid, cuisines);
        set((s) => ({
          users: s.users.map((u) =>
            u.id === uid ? { ...u, favoriteCuisines: cuisines, hasCompletedTasteQuiz: true } : u,
          ),
        }));
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Could not save preferences" };
      }
    }

    set((s) => ({
      users: s.users.map((u) =>
        u.id === uid ? { ...u, favoriteCuisines: cuisines, hasCompletedTasteQuiz: true } : u
      ),
    }));
    return { ok: true };
  },

  registerPush: async () => {
    const uid = get().currentUserId;
    if (!uid || !get().useSupabase) return;
    try {
      const token = await registerForPushNotifications();
      if (token) await tier1.savePushToken(uid, token);
    } catch (e) {
      console.warn("Push registration failed:", e);
    }
  },

  markNotificationsRead: async () => {
    const uid = get().currentUserId;
    if (!uid) return;
    const hasUnread = get().notifications.some((n) => !n.read);
    if (!hasUnread) return;
    if (get().useSupabase) await tier1.markNotificationsRead(uid);
    set((s) => ({
      notifications: s.notifications.map((n) => (n.read ? n : { ...n, read: true })),
    }));
  },

  createList: async (name, description) => {
    const uid = get().currentUserId;
    if (!uid) return { error: "Not signed in" };
    if (!name.trim()) return { error: "Name is required" };

    if (get().useSupabase) {
      try {
        const list = await tier1.createListDb(uid, name, description);
        set((s) => ({ lists: [list, ...s.lists] }));
        return { listId: list.id };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Could not create list" };
      }
    }

    const list: List = {
      id: generateId("list"), userId: uid, name: name.trim(), description: description.trim(),
      isPublic: true, createdAt: new Date().toISOString(),
    };
    set((s) => ({ lists: [list, ...s.lists] }));
    return { listId: list.id };
  },

  deleteList: async (listId) => {
    if (get().useSupabase) {
      try {
        await tier1.deleteListDb(listId);
      } catch (e) {
        console.error("Delete list failed:", e);
        return;
      }
    }
    set((s) => ({
      lists: s.lists.filter((l) => l.id !== listId),
      listItems: s.listItems.filter((li) => li.listId !== listId),
    }));
  },

  addListItem: async (listId, restaurantId, note = "") => {
    const position = get().listItems.filter((li) => li.listId === listId).length + 1;

    if (get().useSupabase) {
      try {
        const item = await tier1.addListItemDb(listId, restaurantId, note, position);
        set((s) => ({ listItems: [...s.listItems, item] }));
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Could not add restaurant" };
      }
    }

    const item: ListItem = {
      id: generateId("li"), listId, restaurantId, note, position,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ listItems: [...s.listItems, item] }));
    return { ok: true };
  },

  removeListItem: async (itemId) => {
    if (get().useSupabase) {
      try {
        await tier1.removeListItemDb(itemId);
      } catch (e) {
        console.error("Remove list item failed:", e);
        return;
      }
    }
    set((s) => ({ listItems: s.listItems.filter((li) => li.id !== itemId) }));
  },

  getMyLists: () => {
    const uid = get().currentUserId;
    if (!uid) return [];
    const collabListIds = new Set(
      get().listCollaborators.filter((c) => c.userId === uid).map((c) => c.listId),
    );
    return get().lists.filter((l) => l.userId === uid || collabListIds.has(l.id));
  },

  canEditList: (listId) => {
    const uid = get().currentUserId;
    if (!uid) return false;
    const list = get().lists.find((l) => l.id === listId);
    if (!list) return false;
    if (list.userId === uid) return true;
    return get().listCollaborators.some((c) => c.listId === listId && c.userId === uid);
  },

  getListCollaborators: (listId) => get().listCollaborators.filter((c) => c.listId === listId),

  inviteListCollaborator: async (listId, userId) => {
    const uid = get().currentUserId;
    if (!uid) return { ok: false, error: "Not signed in" };
    const list = get().lists.find((l) => l.id === listId);
    if (!list || list.userId !== uid) return { ok: false, error: "Only the list owner can invite" };
    if (get().listCollaborators.some((c) => c.listId === listId && c.userId === userId)) {
      return { ok: false, error: "Already a collaborator" };
    }

    if (get().useSupabase) {
      try {
        const collab = await tier1.inviteListCollaboratorDb(listId, userId);
        set((s) => ({ listCollaborators: [...s.listCollaborators, collab] }));
        return { ok: true };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not invite";
        if (msg.toLowerCase().includes("list_collaborators")) {
          return { ok: false, error: "Collaborative lists need migration 004_tier_b.sql in Supabase." };
        }
        return { ok: false, error: msg };
      }
    }

    const collab: ListCollaborator = {
      id: generateId("lc"),
      listId,
      userId,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ listCollaborators: [...s.listCollaborators, collab] }));
    return { ok: true };
  },

  removeListCollaborator: async (collaboratorId) => {
    if (get().useSupabase) {
      try {
        await tier1.removeListCollaboratorDb(collaboratorId);
      } catch (e) {
        console.error("Remove collaborator failed:", e);
        return;
      }
    }
    set((s) => ({ listCollaborators: s.listCollaborators.filter((c) => c.id !== collaboratorId) }));
  },

  addDish: async (reviewId, dish) => {
    const uid = get().currentUserId;
    if (!uid) return { error: "Not signed in" };
    if (!dish.name.trim()) return { error: "Dish name is required" };

    if (get().useSupabase) {
      try {
        const created = await tier1.addDishDb(uid, reviewId, dish);
        set((s) => ({ dishes: [...s.dishes, created] }));
        return { dishId: created.id };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Could not add dish" };
      }
    }

    const review = get().reviews.find((r) => r.id === reviewId);
    if (!review || review.userId !== uid) return { error: "Review not found" };
    const created: Dish = {
      id: generateId("dish"),
      reviewId,
      restaurantId: review.restaurantId,
      name: dish.name.trim(),
      rating: dish.rating,
      ratingValue: dish.rating,
      ratingMax: 10,
      normalizedRating: Math.min(100, Math.max(0, dish.rating * 10)),
      notes: dish.notes,
      photoUrl: null,
      isBestDish: dish.isBestDish,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ dishes: [...s.dishes, created] }));
    return { dishId: created.id };
  },

  isBookmarked: (googlePlaceId) =>
    get().bookmarks.some((b) => b.googlePlaceId === googlePlaceId),

  isRestaurantBookmarked: (restaurant) => {
    const placeId = restaurant.googlePlaceId ?? `restaurant:${restaurant.id}`;
    return get().bookmarks.some(
      (b) => b.googlePlaceId === placeId || b.restaurantId === restaurant.id,
    );
  },

  toggleBookmark: async (place) => {
    const uid = get().currentUserId;
    if (!uid) return { ok: false, error: "Not signed in" };

    const existing = get().bookmarks.find((b) => b.googlePlaceId === place.googlePlaceId);
    if (existing) {
      set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== existing.id) }));
      if (get().useSupabase) {
        try {
          await tier2.removeBookmarkDb(existing.id);
        } catch (e) {
          set((s) => ({ bookmarks: [existing, ...s.bookmarks] }));
          return { ok: false, error: e instanceof Error ? e.message : "Could not remove bookmark" };
        }
      }
      return { ok: true };
    }

    const tempBookmark: Bookmark = {
      id: `opt-bm-${place.googlePlaceId}`,
      userId: uid,
      restaurantId: null,
      googlePlaceId: place.googlePlaceId,
      placeName: place.name,
      placeAddress: place.address,
      placeCity: place.city,
      placeCuisine: place.cuisine,
      placePriceLevel: place.priceLevel ?? null,
      placeImageUrl: place.imageUrl,
      latitude: place.latitude,
      longitude: place.longitude,
      status: "want_to_try",
      reasonSaved: "Saved from Discover",
      plannedAt: null,
      visitedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdVia: "discover",
      resolutionStatus: "linked",
      sourcePlatform: null,
      primarySourceTitle: null,
      primarySourceThumbnailUrl: null,
      sources: [],
    };
    set((s) => ({ bookmarks: [tempBookmark, ...s.bookmarks] }));

    if (get().useSupabase) {
      try {
        const bookmark = await tier2.addBookmarkDb(uid, place);
        set((s) => ({
          bookmarks: [bookmark, ...s.bookmarks.filter((b) => b.id !== tempBookmark.id)],
        }));
        return { ok: true };
      } catch (e) {
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== tempBookmark.id) }));
        return { ok: false, error: e instanceof Error ? e.message : "Could not save bookmark" };
      }
    }

    const bookmark: Bookmark = {
      id: generateId("bm"),
      userId: uid,
      restaurantId: null,
      googlePlaceId: place.googlePlaceId,
      placeName: place.name,
      placeAddress: place.address,
      placeCity: place.city,
      placeCuisine: place.cuisine,
      placePriceLevel: place.priceLevel ?? null,
      placeImageUrl: place.imageUrl,
      latitude: place.latitude,
      longitude: place.longitude,
      status: "want_to_try",
      reasonSaved: "Saved from Discover",
      plannedAt: null,
      visitedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdVia: "discover",
      resolutionStatus: "linked",
      sourcePlatform: null,
      primarySourceTitle: null,
      primarySourceThumbnailUrl: null,
      sources: [],
    };
    set((s) => ({
      bookmarks: [bookmark, ...s.bookmarks.filter((b) => b.id !== tempBookmark.id)],
    }));
    return { ok: true };
  },

  toggleRestaurantBookmark: async (restaurant) => {
    const uid = get().currentUserId;
    if (!uid) return { ok: false, error: "Not signed in" };

    const placeId = restaurant.googlePlaceId ?? `restaurant:${restaurant.id}`;
    const existing = get().bookmarks.find(
      (b) => b.googlePlaceId === placeId || b.restaurantId === restaurant.id,
    );

    if (existing) {
      if (get().useSupabase) {
        try {
          await tier2.removeBookmarkDb(existing.id);
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Could not remove bookmark" };
        }
      }
      set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== existing.id) }));
      return { ok: true };
    }

    if (get().useSupabase) {
      try {
        const bookmark = await tier2.addBookmarkFromRestaurantDb(uid, restaurant);
        set((s) => ({ bookmarks: [bookmark, ...s.bookmarks] }));
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Could not save bookmark" };
      }
    }

    const bookmark: Bookmark = {
      id: generateId("bm"),
      userId: uid,
      restaurantId: restaurant.id,
      googlePlaceId: placeId,
      placeName: restaurant.name,
      placeAddress: restaurant.address,
      placeCity: restaurant.city,
      placeCuisine: restaurant.cuisine,
      placePriceLevel: restaurant.priceLevel ?? null,
      placeImageUrl: restaurant.imageUrl,
      latitude: restaurant.latitude ?? null,
      longitude: restaurant.longitude ?? null,
      status: "want_to_try",
      reasonSaved: "Saved to bucket list",
      plannedAt: null,
      visitedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdVia: "restaurant",
      resolutionStatus: "linked",
      sourcePlatform: null,
      primarySourceTitle: null,
      primarySourceThumbnailUrl: null,
      sources: [],
    };
    set((s) => ({ bookmarks: [bookmark, ...s.bookmarks] }));
    return { ok: true };
  },

  removeBookmark: async (bookmarkId) => {
    if (get().useSupabase) {
      try {
        await tier2.removeBookmarkDb(bookmarkId);
      } catch (e) {
        console.error("Remove bookmark failed:", e);
        return;
      }
    }
    set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== bookmarkId) }));
  },

  saveShareToTryNext: async (opts) => {
    const uid = get().currentUserId;
    if (!uid) return { ok: false, error: "Not signed in" };

    const source = {
      sourceUrl: opts.sourceUrl,
      canonicalUrl: opts.canonicalUrl,
      sourcePlatform: opts.sourcePlatform,
      title: opts.sourceTitle ?? null,
      thumbnailUrl: opts.sourceThumbnailUrl ?? null,
    };

    if (get().useSupabase) {
      try {
        const result = await tier2.saveShareBookmarkDb({
          userId: uid,
          placeName: opts.placeName,
          placeAddress: opts.placeAddress,
          placeCity: opts.placeCity,
          placeCuisine: opts.placeCuisine,
          placeImageUrl: opts.placeImageUrl,
          placePriceLevel: opts.placePriceLevel,
          latitude: opts.latitude,
          longitude: opts.longitude,
          googlePlaceId: opts.linkOnly ? null : opts.googlePlaceId ?? null,
          restaurantId: opts.linkOnly ? null : opts.restaurantId ?? null,
          note: opts.note,
          createdVia: "share_extension",
          resolutionStatus: opts.linkOnly ? "link_only" : "linked",
          sourcePlatform: opts.sourcePlatform,
          sourceTitle: opts.sourceTitle,
          sourceThumbnailUrl: opts.sourceThumbnailUrl,
          source,
        });
        set((s) => ({
          bookmarks: [
            result.bookmark,
            ...s.bookmarks.filter((b) => b.id !== result.bookmark.id),
          ],
        }));
        return { ok: true, bookmark: result.bookmark, alreadyExisted: result.alreadyExisted };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Could not save bookmark" };
      }
    }

    // Demo / offline path
    const existing = get().bookmarks.find(
      (b) =>
        (!opts.linkOnly &&
          opts.googlePlaceId &&
          b.googlePlaceId === opts.googlePlaceId) ||
        (!opts.linkOnly && opts.restaurantId && b.restaurantId === opts.restaurantId),
    );

    const sourceRow = {
      id: generateId("src"),
      savedRestaurantId: existing?.id ?? generateId("bm"),
      userId: uid,
      sourceUrl: opts.sourceUrl,
      canonicalUrl: opts.canonicalUrl,
      sourcePlatform: opts.sourcePlatform,
      title: opts.sourceTitle ?? null,
      thumbnailUrl: opts.sourceThumbnailUrl ?? null,
      createdAt: new Date().toISOString(),
    };

    if (existing) {
      const updated: Bookmark = {
        ...existing,
        sources: [
          sourceRow,
          ...existing.sources.filter((s) => s.canonicalUrl !== opts.canonicalUrl),
        ],
        sourcePlatform: opts.sourcePlatform,
        primarySourceTitle: opts.sourceTitle ?? existing.primarySourceTitle,
        primarySourceThumbnailUrl:
          opts.sourceThumbnailUrl ?? existing.primarySourceThumbnailUrl,
        updatedAt: new Date().toISOString(),
      };
      set((s) => ({
        bookmarks: s.bookmarks.map((b) => (b.id === existing.id ? updated : b)),
      }));
      return { ok: true, bookmark: updated, alreadyExisted: true };
    }

    const bookmark: Bookmark = {
      id: sourceRow.savedRestaurantId,
      userId: uid,
      restaurantId: opts.linkOnly ? null : opts.restaurantId ?? null,
      googlePlaceId: opts.linkOnly ? null : opts.googlePlaceId ?? null,
      placeName: opts.placeName,
      placeAddress: opts.placeAddress ?? "",
      placeCity: opts.placeCity ?? "",
      placeCuisine: (opts.placeCuisine as Bookmark["placeCuisine"]) ?? null,
      placePriceLevel: (opts.placePriceLevel as Bookmark["placePriceLevel"]) ?? null,
      placeImageUrl: opts.placeImageUrl ?? null,
      latitude: opts.latitude ?? null,
      longitude: opts.longitude ?? null,
      status: "want_to_try",
      reasonSaved: opts.note?.trim() || `Saved from ${opts.sourcePlatform}`,
      plannedAt: null,
      visitedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdVia: "share_extension",
      resolutionStatus: opts.linkOnly ? "link_only" : "linked",
      sourcePlatform: opts.sourcePlatform,
      primarySourceTitle: opts.sourceTitle ?? null,
      primarySourceThumbnailUrl: opts.sourceThumbnailUrl ?? null,
      sources: [sourceRow],
    };
    set((s) => ({ bookmarks: [bookmark, ...s.bookmarks] }));
    return { ok: true, bookmark, alreadyExisted: false };
  },

  removeSavedSource: async (sourceId, bookmarkId) => {
    if (get().useSupabase) {
      try {
        await tier2.removeSavedItemSourceDb(sourceId);
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Could not remove link" };
      }
    }
    set((s) => ({
      bookmarks: s.bookmarks.map((b) =>
        b.id === bookmarkId
          ? { ...b, sources: b.sources.filter((src) => src.id !== sourceId) }
          : b,
      ),
    }));
    return { ok: true };
  },

  updateBookmarkStatus: async (bookmarkId, status, opts) => {
    const bookmark = get().bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) return { ok: false, error: "Bookmark not found" };

    const now = new Date().toISOString();
    const plannedAt =
      status === "planned" ? (opts?.plannedAt ?? now) : bookmark.plannedAt;
    const visitedAt =
      status === "visited" ? (opts?.visitedAt ?? now) : bookmark.visitedAt;
    const restaurantId =
      opts?.restaurantId !== undefined ? opts.restaurantId : bookmark.restaurantId;

    const patch: Partial<Bookmark> = {
      status,
      updatedAt: now,
      plannedAt: plannedAt ?? null,
      visitedAt: visitedAt ?? null,
      restaurantId: restaurantId ?? null,
    };

    const previous = bookmark;
    set((s) => ({
      bookmarks: s.bookmarks.map((b) => (b.id === bookmarkId ? { ...b, ...patch } : b)),
    }));

    if (get().useSupabase) {
      try {
        const updated = await tier2.updateBookmarkDb(bookmarkId, {
          status,
          plannedAt: status === "planned" ? plannedAt : undefined,
          visitedAt: status === "visited" ? visitedAt : undefined,
          restaurantId: opts?.restaurantId !== undefined ? opts.restaurantId : undefined,
        });
        set((s) => ({
          bookmarks: s.bookmarks.map((b) => (b.id === bookmarkId ? updated : b)),
        }));
      } catch (e) {
        set((s) => ({
          bookmarks: s.bookmarks.map((b) => (b.id === bookmarkId ? previous : b)),
        }));
        return { ok: false, error: e instanceof Error ? e.message : "Could not update status" };
      }
    }

    const current = get().bookmarks.find((b) => b.id === bookmarkId)!;
    return { ok: true, restaurantId: current.restaurantId };
  },

  isRestaurantFavorite: (restaurantId) =>
    Boolean(isRestaurantFavorited(get().favorites, restaurantId)),

  isDishFavorite: (dishId) => Boolean(isDishFavorited(get().favorites, dishId)),

  updateReviewVisibility: async (reviewId, visibility) => {
    const uid = get().currentUserId;
    if (!uid) return { ok: false, error: "Not signed in" };
    const existing = get().reviews.find((r) => r.id === reviewId && r.userId === uid);
    if (!existing) return { ok: false, error: "Review not found" };

    const previous = existing.visibility;
    set((s) => ({
      reviews: s.reviews.map((r) => (r.id === reviewId ? { ...r, visibility } : r)),
    }));

    if (get().useSupabase) {
      try {
        const supabase = (await import("@/lib/supabase/client")).getSupabase();
        if (!supabase) throw new Error("Supabase not configured");
        const { error } = await supabase
          .from("reviews")
          .update({ visibility })
          .eq("id", reviewId)
          .eq("user_id", uid);
        if (error) throw new Error(error.message);
      } catch (e) {
        set((s) => ({
          reviews: s.reviews.map((r) =>
            r.id === reviewId ? { ...r, visibility: previous } : r,
          ),
        }));
        return { ok: false, error: e instanceof Error ? e.message : "Could not update visibility" };
      }
    }
    return { ok: true };
  },

  toggleRestaurantFavorite: async (restaurantId) => {
    const uid = get().currentUserId;
    if (!uid) return { ok: false, error: "Not signed in" };

    const existing = isRestaurantFavorited(get().favorites, restaurantId);
    if (existing) {
      set((s) => ({ favorites: s.favorites.filter((f) => f.id !== existing.id) }));
      if (get().useSupabase) {
        try {
          await tier2.removeFavorite(existing.id);
        } catch (e) {
          set((s) => ({ favorites: [existing, ...s.favorites] }));
          return { ok: false, error: e instanceof Error ? e.message : "Could not remove favorite" };
        }
      }
      return { ok: true };
    }

    const temp: Favorite = {
      id: generateId("fav"),
      userId: uid,
      restaurantId,
      dishId: null,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ favorites: [temp, ...s.favorites] }));

    if (get().useSupabase) {
      try {
        const created = await tier2.addRestaurantFavorite(uid, restaurantId);
        set((s) => ({
          favorites: [created, ...s.favorites.filter((f) => f.id !== temp.id)],
        }));
      } catch (e) {
        set((s) => ({ favorites: s.favorites.filter((f) => f.id !== temp.id) }));
        return { ok: false, error: e instanceof Error ? e.message : "Could not add favorite" };
      }
    }
    return { ok: true };
  },

  toggleDishFavorite: async (dishId) => {
    const uid = get().currentUserId;
    if (!uid) return { ok: false, error: "Not signed in" };

    const existing = isDishFavorited(get().favorites, dishId);
    if (existing) {
      set((s) => ({ favorites: s.favorites.filter((f) => f.id !== existing.id) }));
      if (get().useSupabase) {
        try {
          await tier2.removeFavorite(existing.id);
        } catch (e) {
          set((s) => ({ favorites: [existing, ...s.favorites] }));
          return { ok: false, error: e instanceof Error ? e.message : "Could not remove favorite" };
        }
      }
      return { ok: true };
    }

    const temp: Favorite = {
      id: generateId("fav"),
      userId: uid,
      restaurantId: null,
      dishId,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ favorites: [temp, ...s.favorites] }));

    if (get().useSupabase) {
      try {
        const created = await tier2.addDishFavorite(uid, dishId);
        set((s) => ({
          favorites: [created, ...s.favorites.filter((f) => f.id !== temp.id)],
        }));
      } catch (e) {
        set((s) => ({ favorites: s.favorites.filter((f) => f.id !== temp.id) }));
        return { ok: false, error: e instanceof Error ? e.message : "Could not add favorite" };
      }
    }
    return { ok: true };
  },
}));
