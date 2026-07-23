import { buildMixedFeed, type BuildFeedInput } from "@/lib/feed/build-candidates";
import { DEFAULT_FEED_PREFERENCES } from "@/lib/feed-preferences";
import { EMPTY_FEED_DISMISSALS } from "@/lib/feed-dismissals";
import { TAB_SCROLL_BOTTOM_PADDING, getFloatingTabClearance } from "@/lib/tab-bar";
import type { Dish, Follow, Restaurant, Review, User } from "@/lib/types";

function user(id: string): User {
  return {
    id,
    email: `${id}@t.com`,
    username: id,
    displayName: id,
    avatarUrl: null,
    city: "Houston",
    bio: "",
    favoriteCuisines: ["Japanese", "Italian"],
    hasCompletedTasteQuiz: true,
    createdAt: "2024-01-01",
  };
}

function rest(id: string, cuisine: Restaurant["cuisine"] = "Italian"): Restaurant {
  return {
    id,
    name: id,
    address: "1 Main",
    city: "Houston",
    cuisine,
    priceLevel: 2,
    imageUrl: null,
    latitude: 29.76,
    longitude: -95.37,
    createdAt: "2024-01-01",
  };
}

function review(id: string, userId: string, restaurantId: string, rating = 9): Review {
  return {
    id,
    userId,
    restaurantId,
    rating,
    ratingValue: rating,
    ratingMax: 10,
    normalizedRating: rating * 10,
    visibility: "friends",
    categoryScores: { foodQuality: rating, service: rating, atmosphere: rating, value: rating },
    ratingManualOverride: false,
    waitTime: null,
    wouldReturn: true,
    wouldRecommend: true,
    text: "Loved it",
    visitDate: "2024-06-01",
    tags: ["Hidden Gem"],
    createdAt: "2024-06-01T12:00:00Z",
  };
}

function baseInput(overrides: Partial<BuildFeedInput> = {}): BuildFeedInput {
  const me = user("me");
  const friend = user("friend");
  const restaurants = [
    rest("r1", "Japanese"),
    rest("r2", "Italian"),
    rest("r3", "Mexican"),
    rest("r4", "Thai"),
  ];
  const reviews: Review[] = [
    review("rev-me", "me", "r1", 9),
    review("rev-friend", "friend", "r2", 9),
  ];
  const follows: Follow[] = [
    { id: "f1", followerId: "me", followingId: "friend", createdAt: "2024-01-01" },
  ];
  const dishes: Dish[] = [
    {
      id: "d1",
      reviewId: "rev-friend",
      restaurantId: "r2",
      name: "Pasta",
      rating: 9,
      ratingValue: 9,
      ratingMax: 10,
      normalizedRating: 90,
      notes: "",
      photoUrl: null,
      isBestDish: true,
      createdAt: "2024-01-01",
    },
  ];

  return {
    userId: "me",
    user: me,
    users: [me, friend],
    reviews,
    restaurants,
    dishes,
    follows,
    likes: [],
    comments: [],
    reviewPhotos: [],
    bookmarks: [],
    prefs: { ...DEFAULT_FEED_PREFERENCES },
    dismissals: {
      ...EMPTY_FEED_DISMISSALS,
      restaurantIds: [],
      mutedUserIds: [],
      fewerCuisines: [],
      hiddenReviewIds: [],
    },
    tastePrefs: null,
    coords: { latitude: 29.76, longitude: -95.37 },
    sessionKey: "test",
    ...overrides,
  };
}

describe("buildMixedFeed", () => {
  it("builds friends activity without For You recs", () => {
    const items = buildMixedFeed(baseInput());
    expect(items.some((i) => i.type === "friend_review")).toBe(true);
    expect(items.every((i) => i.type === "friend_review" || i.type === "prompt")).toBe(true);
    expect(items.every((i) => i.type !== "friend_save")).toBe(true);
  });

  it("no-friends feed stays useful with prompts and excludes own reviews", () => {
    const items = buildMixedFeed(
      baseInput({
        follows: [],
        reviews: [review("rev-me", "me", "r1", 9)],
      }),
    );
    expect(items.some((i) => i.type === "prompt" && i.kind === "find_friends")).toBe(true);
    expect(items.every((i) => i.type !== "friend_review")).toBe(true);
  });

  it("never includes the current user’s reviews on Feed", () => {
    const items = buildMixedFeed(baseInput());
    expect(
      items
        .filter((i) => i.type === "friend_review")
        .every((i) => i.type === "friend_review" && !i.isOwn && i.author.id !== "me"),
    ).toBe(true);
  });

  it("excludes dismissed friend restaurants", () => {
    const items = buildMixedFeed(
      baseInput({
        dismissals: {
          restaurantIds: ["r2"],
          mutedUserIds: [],
          fewerCuisines: [],
          hiddenReviewIds: [],
        },
      }),
    );
    const friendRestaurantIds = items
      .filter((i) => i.type === "friend_review")
      .map((i) => (i.type === "friend_review" ? i.restaurant.id : ""));
    expect(friendRestaurantIds).not.toContain("r2");
  });

  it("never emits friend_save even if showFriendSaves true", () => {
    const items = buildMixedFeed(
      baseInput({
        prefs: { ...DEFAULT_FEED_PREFERENCES, showFriendSaves: true },
      }),
    );
    expect(items.some((i) => i.type === "friend_save")).toBe(false);
  });

  it("never includes private reviews on Feed", () => {
    const privateOwn = {
      ...review("rev-priv", "me", "r1", 9),
      visibility: "private" as const,
    };
    const privateFriend = {
      ...review("rev-priv-f", "friend", "r2", 9),
      visibility: "private" as const,
    };
    const shared = review("rev-shared", "friend", "r-shared", 8);
    const items = buildMixedFeed(
      baseInput({
        restaurants: [
          rest("r1", "Japanese"),
          rest("r2", "Italian"),
          rest("r3", "Mexican"),
          rest("r4", "Thai"),
          rest("r-shared", "Korean"),
        ],
        reviews: [
          privateOwn,
          review("rev-me-r2", "me", "r2", 8),
          review("rev-me-r3", "me", "r3", 8),
          review("rev-me-r4", "me", "r4", 8),
          privateFriend,
          shared,
        ],
      }),
    );
    const reviewIds = items
      .filter((i) => i.type === "friend_review")
      .map((i) => (i.type === "friend_review" ? i.review.id : ""));
    expect(reviewIds).not.toContain("rev-priv");
    expect(reviewIds).not.toContain("rev-priv-f");
    expect(reviewIds).not.toContain("rev-me-r2");
    expect(reviewIds).toContain("rev-shared");
  });
});

describe("feed tab clearance", () => {
  it("uses floating tab scroll padding", () => {
    expect(TAB_SCROLL_BOTTOM_PADDING).toBeGreaterThanOrEqual(getFloatingTabClearance(34));
  });
});
