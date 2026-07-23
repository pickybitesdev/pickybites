import { filterFeedByScope } from "@/lib/feed/filter";
import {
  DEFAULT_FEED_PREFERENCES,
  resetFeedPreferences,
  type FeedPreferences,
} from "@/lib/feed-preferences";
import {
  EMPTY_FEED_DISMISSALS,
  dismissRestaurant,
  fewerLikeCuisine,
  hideReview,
  muteUser,
} from "@/lib/feed-dismissals";
import { dedupeFeedItems, filterFeedItems } from "@/lib/feed/filter";
import { mixFeedItems, resolveMixWeights } from "@/lib/feed/mix";
import { createFeedPageState, loadMoreFeedItems, resetFeedPage } from "@/lib/feed/pagination";
import { buildTasteMatchCandidates, orderFriendReviews, rankRestaurantRecs } from "@/lib/feed/rank";
import type {
  FeedFriendReviewItem,
  FeedItem,
  FeedPromptItem,
  FeedRestaurantRecItem,
} from "@/lib/feed/types";
import type { Restaurant, Review, User } from "@/lib/types";

function rest(partial: Partial<Restaurant> & { id: string; name: string }): Restaurant {
  return {
    address: "1 Main",
    city: "Houston",
    cuisine: "Italian",
    priceLevel: 2,
    imageUrl: null,
    latitude: 29.76,
    longitude: -95.37,
    createdAt: "2024-01-01",
    ...partial,
  };
}

function user(id: string, name = id): User {
  return {
    id,
    email: `${id}@t.com`,
    username: id,
    displayName: name,
    avatarUrl: null,
    city: "Houston",
    bio: "",
    favoriteCuisines: ["Italian"],
    hasCompletedTasteQuiz: true,
    createdAt: "2024-01-01",
  };
}

function review(partial: Partial<Review> & { id: string; userId: string; restaurantId: string }): Review {
  const rating = partial.rating ?? 8;
  return {
    rating,
    ratingValue: partial.ratingValue ?? rating,
    ratingMax: partial.ratingMax ?? 10,
    normalizedRating: partial.normalizedRating ?? rating * 10,
    visibility: partial.visibility ?? "friends",
    categoryScores: { foodQuality: 8, service: 8, atmosphere: 8, value: 8 },
    ratingManualOverride: false,
    waitTime: null,
    wouldReturn: true,
    wouldRecommend: true,
    text: "Great",
    visitDate: "2024-06-01",
    tags: [],
    createdAt: "2024-06-01T12:00:00Z",
    ...partial,
  };
}

function rec(id: string, restaurantId = id): FeedRestaurantRecItem {
  return {
    id: `rec:${restaurantId}`,
    type: "restaurant_rec",
    restaurant: rest({ id: restaurantId, name: id }),
    matchPercent: 80,
    reason: "Matches your love for Italian food",
  };
}

function friendReview(id: string, authorId: string, restaurantId: string): FeedFriendReviewItem {
  return {
    id: `review:${id}`,
    type: "friend_review",
    review: review({ id, userId: authorId, restaurantId }),
    author: user(authorId),
    restaurant: rest({ id: restaurantId, name: restaurantId }),
    isOwn: false,
    likeCount: 2,
    commentCount: 1,
    imageUrl: null,
  };
}

describe("feed mix weights", () => {
  it("boosts personalized when user follows nobody", () => {
    const w = resolveMixWeights(DEFAULT_FEED_PREFERENCES, {
      personalized: 10,
      friendActivity: 0,
      discovery: 2,
    }, 0);
    expect(w.friendActivity).toBe(0);
    expect(w.personalized).toBeGreaterThan(0.6);
  });

  it("boosts friends when recommendations are thin", () => {
    const w = resolveMixWeights(DEFAULT_FEED_PREFERENCES, {
      personalized: 1,
      friendActivity: 10,
      discovery: 1,
    }, 3);
    expect(w.friendActivity).toBeGreaterThan(0.5);
  });

  it("respects recommendations balance preference", () => {
    const prefs: FeedPreferences = { ...DEFAULT_FEED_PREFERENCES, balance: "recommendations" };
    const w = resolveMixWeights(prefs, { personalized: 10, friendActivity: 10, discovery: 5 }, 2);
    expect(w.personalized).toBeGreaterThan(w.friendActivity);
  });
});

describe("feed mixing", () => {
  it("interleaves personalized and friend activity", () => {
    const mixed = mixFeedItems(
      {
        personalized: [rec("a"), rec("b"), rec("c")],
        friendActivity: [
          friendReview("1", "u1", "r1"),
          friendReview("2", "u2", "r2"),
          friendReview("3", "u3", "r3"),
        ],
        discovery: [],
      },
      { personalized: 0.4, friendActivity: 0.4, discovery: 0.2 },
    );
    const types = mixed.map((m) => m.type);
    expect(types).toContain("restaurant_rec");
    expect(types).toContain("friend_review");
    // Avoid long runs of the same type at the start
    let adjacentSame = 0;
    for (let i = 1; i < Math.min(types.length, 6); i++) {
      if (types[i] === types[i - 1]) adjacentSame++;
    }
    expect(adjacentSame).toBeLessThanOrEqual(1);
  });

  it("injects find friends prompt when provided", () => {
    const prompt: FeedPromptItem = {
      id: "prompt:find_friends:s",
      type: "prompt",
      kind: "find_friends",
      title: "Your Feed is getting started",
      body: "Follow friends",
      primaryActionLabel: "Find Friends",
    };
    const mixed = mixFeedItems(
      { personalized: [rec("a")], friendActivity: [], discovery: [] },
      { personalized: 0.7, friendActivity: 0, discovery: 0.3 },
      { findFriendsPrompt: prompt },
    );
    expect(mixed[0]?.type).toBe("prompt");
    expect(mixed[0] && mixed[0].type === "prompt" && mixed[0].kind).toBe("find_friends");
  });

  it("never includes friend_save from filter", () => {
    const items: FeedItem[] = [
      rec("a"),
      {
        id: "save:x",
        type: "friend_save",
        friend: user("f1"),
        restaurant: rest({ id: "rx", name: "Secret" }),
        listLabel: "Try Next",
      },
    ];
    const filtered = filterFeedItems(items, DEFAULT_FEED_PREFERENCES, EMPTY_FEED_DISMISSALS);
    expect(filtered.every((i) => i.type !== "friend_save")).toBe(true);
  });
});

describe("feed ranking", () => {
  it("orders restaurant recs by match percent", () => {
    const ranked = rankRestaurantRecs([
      { ...rec("low"), matchPercent: 50 },
      { ...rec("high"), matchPercent: 90 },
    ]);
    expect(ranked[0].matchPercent).toBe(90);
  });

  it("builds taste match candidates from similar users", () => {
    const me = user("me");
    const other = user("other");
    const restaurants = [
      rest({ id: "shared", name: "Shared", cuisine: "Italian" }),
      rest({ id: "loved", name: "Loved", cuisine: "Italian" }),
    ];
    const reviews = [
      review({ id: "m1", userId: "me", restaurantId: "shared", rating: 9 }),
      review({ id: "o1", userId: "other", restaurantId: "shared", rating: 9 }),
      review({ id: "o2", userId: "other", restaurantId: "loved", rating: 9 }),
    ];
    const items = buildTasteMatchCandidates("me", [me, other], reviews, restaurants, new Set(["shared"]), 10);
    expect(items.some((i) => i.restaurant.id === "loved")).toBe(true);
    expect(items.every((i) => i.type === "taste_match_rec")).toBe(true);
  });
});

describe("feed preference filtering", () => {
  it("filters by price levels", () => {
    const prefs: FeedPreferences = { ...DEFAULT_FEED_PREFERENCES, priceLevels: [1] };
    const items: FeedItem[] = [
      { ...rec("cheap"), restaurant: rest({ id: "cheap", name: "Cheap", priceLevel: 1 }) },
      { ...rec("pricey"), restaurant: rest({ id: "pricey", name: "Pricey", priceLevel: 4 }) },
    ];
    const filtered = filterFeedItems(items, prefs, EMPTY_FEED_DISMISSALS);
    expect(filtered.map((i) => i.id)).toEqual(["rec:cheap"]);
  });

  it("filters friend reviews by cuisine and price", () => {
    const prefs: FeedPreferences = {
      ...DEFAULT_FEED_PREFERENCES,
      cuisineOverrides: ["Italian"],
      priceLevels: [2],
    };
    const items: FeedItem[] = [
      {
        ...friendReview("it", "u1", "r-it"),
        restaurant: rest({ id: "r-it", name: "IT", cuisine: "Italian", priceLevel: 2 }),
      },
      {
        ...friendReview("mx", "u1", "r-mx"),
        restaurant: rest({ id: "r-mx", name: "MX", cuisine: "Mexican", priceLevel: 2 }),
      },
      {
        ...friendReview("pricey", "u1", "r-pr"),
        restaurant: rest({ id: "r-pr", name: "PR", cuisine: "Italian", priceLevel: 4 }),
      },
    ];
    const filtered = filterFeedItems(items, prefs, EMPTY_FEED_DISMISSALS);
    expect(filtered.map((i) => i.id)).toEqual(["review:it"]);
  });

  it("hides dish recs when disabled", () => {
    const prefs: FeedPreferences = { ...DEFAULT_FEED_PREFERENCES, showDishRecs: false };
    const items: FeedItem[] = [
      {
        id: "dish:1",
        type: "dish_rec",
        dish: {
          id: "1",
          reviewId: "r",
          restaurantId: "a",
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
        restaurant: rest({ id: "a", name: "A" }),
        dishScore: 9,
        reason: "top pick",
      },
    ];
    expect(filterFeedItems(items, prefs, EMPTY_FEED_DISMISSALS)).toHaveLength(0);
  });

  it("reset preferences returns defaults", () => {
    expect(resetFeedPreferences()).toEqual(DEFAULT_FEED_PREFERENCES);
  });
});

describe("friend review sort", () => {
  it("orders newest first by default", () => {
    const older = {
      ...friendReview("old", "u1", "r1"),
      review: review({
        id: "old",
        userId: "u1",
        restaurantId: "r1",
        createdAt: "2024-01-01T12:00:00Z",
      }),
    };
    const newer = {
      ...friendReview("new", "u1", "r2"),
      review: review({
        id: "new",
        userId: "u1",
        restaurantId: "r2",
        createdAt: "2024-06-01T12:00:00Z",
      }),
    };
    const ordered = orderFriendReviews(
      [older, newer],
      "newest",
      "me",
      [],
      [],
    );
    expect(ordered.map((i) => i.id)).toEqual(["review:new", "review:old"]);
  });
});

describe("feed dismissals and dedupe", () => {
  it("dismisses restaurants and mutes users", () => {
    let d = EMPTY_FEED_DISMISSALS;
    d = dismissRestaurant(d, "rx");
    d = muteUser(d, "u1");
    d = hideReview(d, "rev1");
    d = fewerLikeCuisine(d, "Italian");

    const items: FeedItem[] = [
      rec("rx", "rx"),
      friendReview("rev1", "u2", "r2"),
      friendReview("rev2", "u1", "r3"),
      { ...rec("it"), restaurant: rest({ id: "it", name: "IT", cuisine: "Italian" }) },
    ];
    // hideReview filters by review id on friend_review
    const withHidden = {
      ...d,
      hiddenReviewIds: ["rev1"],
    };
    const filtered = filterFeedItems(items, DEFAULT_FEED_PREFERENCES, withHidden);
    expect(filtered.find((i) => i.id === "rec:rx")).toBeUndefined();
    expect(filtered.find((i) => i.id === "review:rev2")).toBeUndefined();
    expect(filtered.find((i) => i.id === "review:rev1")).toBeUndefined();
    expect(filtered.find((i) => i.id === "rec:it")).toBeUndefined();
  });

  it("dedupes ids and nearby restaurant repeats", () => {
    const items: FeedItem[] = [rec("a"), rec("a"), friendReview("1", "u", "a"), rec("b")];
    // Second rec:a dropped by id; friend review on same restaurant dropped within window
    const deduped = dedupeFeedItems(items, 6);
    expect(deduped.filter((i) => i.id === "rec:a")).toHaveLength(1);
    expect(deduped.find((i) => i.id === "review:1")).toBeUndefined();
    expect(deduped.find((i) => i.id === "rec:b")).toBeTruthy();
  });
});

describe("feed pagination", () => {
  it("pages without duplicate ids and resets on refresh", () => {
    const session = Array.from({ length: 30 }, (_, i) => rec(`r${i}`));
    let state = createFeedPageState(session, 12);
    expect(state.visible).toHaveLength(12);
    expect(state.hasMore).toBe(true);

    state = loadMoreFeedItems(state, 12);
    expect(state.visible).toHaveLength(24);
    const ids = state.visible.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);

    state = resetFeedPage(session, 12);
    expect(state.visible).toHaveLength(12);
    expect(state.cursor).toBe(12);
  });
});

describe("feed scope separation", () => {
  it("keeps For You and Friends as separate lists", () => {
    const items = [
      rec("a"),
      friendReview("1", "u1", "r1"),
      {
        id: "prompt:x",
        type: "prompt" as const,
        kind: "find_friends" as const,
        title: "t",
        body: "b",
        primaryActionLabel: "Go",
      },
    ];
    const forYou = filterFeedByScope(items, "for_you");
    const friends = filterFeedByScope(items, "friends");
    expect(forYou.every((i) => i.type !== "friend_review")).toBe(true);
    expect(friends.every((i) => i.type === "friend_review")).toBe(true);
    expect(forYou.some((i) => i.type === "restaurant_rec")).toBe(true);
  });
});

describe("feed privacy", () => {
  it("defaults never enable friend saves", () => {
    expect(DEFAULT_FEED_PREFERENCES.showFriendSaves).toBe(false);
  });
});
