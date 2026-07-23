import {
  matchesJournalEntry,
  matchesBookmark,
  matchesFavoriteRestaurant,
  matchesList,
} from "@/lib/bites-search";
import {
  EMPTY_BITES_FILTERS,
  applyJournalFilters,
  applyBookmarkFilters,
  countActiveFilters,
} from "@/lib/bites-filters";
import {
  sortJournalEntries,
  sortBookmarks,
} from "@/lib/bites-sort";
import type { FoodJournalEntry } from "@/lib/foodJournal";
import type { Bookmark, List } from "@/lib/types";
import type { FavoriteRestaurantItem } from "@/lib/favorites";
import {
  getFavoriteRestaurants,
  isRestaurantFavorited,
  isDishFavorited,
} from "@/lib/favorites";
import {
  getFoodJournalEntries,
  getFoodJournalStats,
  groupJournalByMonth,
  journalHasMapPins,
} from "@/lib/foodJournal";
// Food Wrapped ships later — restore when the feature launches
// import { shouldShowWrappedPromo } from "@/components/bites/BitesWrappedPromo";
import type { Dish, Favorite, Restaurant, Review, ReviewPhoto } from "@/lib/types";

function entry(overrides: Partial<FoodJournalEntry>): FoodJournalEntry {
  return {
    review_id: "rev1",
    restaurant_id: "r1",
    restaurant_name: "Taco Spot",
    cuisine: "Mexican",
    city: "LA",
    rating: 8,
    rating_value: 8,
    rating_max: 10,
    normalized_rating: 80,
    visibility: "friends",
    category_scores: { foodQuality: 8, service: 8, atmosphere: 8, value: 8 },
    rating_manual_override: false,
    wait_time: null,
    would_return: true,
    would_recommend: true,
    visit_date: "2024-06-15",
    review_text: "Great tacos",
    tags: [],
    photos: [],
    latitude: 34.05,
    longitude: -118.24,
    dishes: [],
    ...overrides,
  };
}

describe("bites-search", () => {
  it("matches journal entries by name, cuisine, city, and text", () => {
    const e = entry({});
    expect(matchesJournalEntry(e, "taco")).toBe(true);
    expect(matchesJournalEntry(e, "mexican")).toBe(true);
    expect(matchesJournalEntry(e, "pizza")).toBe(false);
    expect(matchesJournalEntry(e, "")).toBe(true);
  });

  it("matches bookmarks and lists", () => {
    const b: Bookmark = {
      id: "b1",
      userId: "u1",
      restaurantId: "r1",
      googlePlaceId: "g1",
      placeName: "Sushi Bar",
      placeAddress: "2 Main",
      placeCity: "SF",
      placeCuisine: "Japanese",
      placePriceLevel: 3,
      placeImageUrl: null,
      latitude: null,
      longitude: null,
      status: "want_to_try",
      reasonSaved: "omakase",
      plannedAt: null,
      visitedAt: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };
    expect(matchesBookmark(b, "sushi")).toBe(true);
    expect(matchesBookmark(b, "omakase")).toBe(true);
    expect(matchesList({ id: "l1", userId: "u1", name: "Date night", description: "fancy", isPublic: true, createdAt: "2024-01-01" } as List, "date")).toBe(true);
  });
});

describe("bites-filters", () => {
  it("counts active filter groups", () => {
    expect(countActiveFilters(EMPTY_BITES_FILTERS)).toBe(0);
    expect(
      countActiveFilters({
        ...EMPTY_BITES_FILTERS,
        cuisines: ["Mexican"],
        minRating: 7,
        visibility: ["private"],
      }),
    ).toBe(3);
  });

  it("filters journal by cuisine, city, rating, visibility", () => {
    const entries = [
      entry({ review_id: "1", cuisine: "Mexican", city: "LA", normalized_rating: 90, visibility: "public" }),
      entry({ review_id: "2", cuisine: "Italian", city: "SF", normalized_rating: 60, visibility: "private" }),
    ];
    expect(
      applyJournalFilters(entries, { ...EMPTY_BITES_FILTERS, cuisines: ["Mexican"] }).map((e) => e.review_id),
    ).toEqual(["1"]);
    expect(
      applyJournalFilters(entries, { ...EMPTY_BITES_FILTERS, minRating: 8 }).map((e) => e.review_id),
    ).toEqual(["1"]);
    expect(
      applyJournalFilters(entries, { ...EMPTY_BITES_FILTERS, visibility: ["private"] }).map((e) => e.review_id),
    ).toEqual(["2"]);
  });

  it("filters bookmarks by status", () => {
    const bookmarks: Bookmark[] = [
      {
        id: "1",
        userId: "u",
        restaurantId: null,
        googlePlaceId: "g1",
        placeName: "A",
        placeAddress: "",
        placeCity: "LA",
        placeCuisine: "Mexican",
        placePriceLevel: 2,
        placeImageUrl: null,
        latitude: null,
        longitude: null,
        status: "want_to_try",
        reasonSaved: "",
        plannedAt: null,
        visitedAt: null,
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      },
      {
        id: "2",
        userId: "u",
        restaurantId: null,
        googlePlaceId: "g2",
        placeName: "B",
        placeAddress: "",
        placeCity: "LA",
        placeCuisine: "Mexican",
        placePriceLevel: 2,
        placeImageUrl: null,
        latitude: null,
        longitude: null,
        status: "planned",
        reasonSaved: "",
        plannedAt: "2024-01-03T00:00:00Z",
        visitedAt: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];
    expect(
      applyBookmarkFilters(bookmarks, {
        ...EMPTY_BITES_FILTERS,
        bookmarkStatuses: ["planned"],
      }).map((b) => b.id),
    ).toEqual(["2"]);
  });
});

describe("bites-sort", () => {
  it("sorts journal by rating and name", () => {
    const entries = [
      entry({ review_id: "a", restaurant_name: "Zebra", normalized_rating: 50, visit_date: "2024-01-01" }),
      entry({ review_id: "b", restaurant_name: "Alpha", normalized_rating: 90, visit_date: "2024-02-01" }),
    ];
    expect(sortJournalEntries(entries, "highest_rated").map((e) => e.review_id)).toEqual(["b", "a"]);
    expect(sortJournalEntries(entries, "name").map((e) => e.review_id)).toEqual(["b", "a"]);
    expect(sortJournalEntries(entries, "newest").map((e) => e.review_id)).toEqual(["b", "a"]);
  });

  it("sorts bookmarks by status", () => {
    const bookmarks: Bookmark[] = [
      {
        id: "want",
        userId: "u",
        restaurantId: null,
        googlePlaceId: "g1",
        placeName: "Want",
        placeAddress: "",
        placeCity: "",
        placeCuisine: null,
        placePriceLevel: null,
        placeImageUrl: null,
        latitude: null,
        longitude: null,
        status: "want_to_try",
        reasonSaved: "",
        plannedAt: null,
        visitedAt: null,
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      },
      {
        id: "plan",
        userId: "u",
        restaurantId: null,
        googlePlaceId: "g2",
        placeName: "Plan",
        placeAddress: "",
        placeCity: "",
        placeCuisine: null,
        placePriceLevel: null,
        placeImageUrl: null,
        latitude: null,
        longitude: null,
        status: "planned",
        reasonSaved: "",
        plannedAt: null,
        visitedAt: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];
    expect(sortBookmarks(bookmarks, "status").map((b) => b.id)).toEqual(["plan", "want"]);
  });
});

describe("favorites helpers", () => {
  const favorites: Favorite[] = [
    { id: "f1", userId: "u", restaurantId: "r1", dishId: null, createdAt: "2024-01-02T00:00:00Z" },
    { id: "f2", userId: "u", restaurantId: null, dishId: "d1", createdAt: "2024-01-01T00:00:00Z" },
  ];
  const restaurants: Restaurant[] = [
    {
      id: "r1",
      name: "Taco Spot",
      address: "1 Main",
      city: "LA",
      cuisine: "Mexican",
      priceLevel: 2,
      imageUrl: null,
      googlePlaceId: "g1",
      latitude: 34,
      longitude: -118,
      createdAt: "2024-01-01",
    },
  ];

  it("detects restaurant and dish favorites uniquely", () => {
    expect(isRestaurantFavorited(favorites, "r1")?.id).toBe("f1");
    expect(isRestaurantFavorited(favorites, "r2")).toBeUndefined();
    expect(isDishFavorited(favorites, "d1")?.id).toBe("f2");
  });

  it("builds favorite restaurant items", () => {
    const items = getFavoriteRestaurants(favorites, restaurants);
    expect(items).toHaveLength(1);
    expect(items[0].restaurant.name).toBe("Taco Spot");
    expect(
      matchesFavoriteRestaurant(items[0] as FavoriteRestaurantItem, "taco"),
    ).toBe(true);
  });
});

describe("food journal extensions", () => {
  const reviews: Review[] = [
    {
      id: "rev1",
      userId: "u1",
      restaurantId: "r1",
      rating: 8,
      ratingValue: 8,
      ratingMax: 10,
      normalizedRating: 80,
      visibility: "friends",
      categoryScores: { foodQuality: 8, service: 8, atmosphere: 8, value: 8 },
      ratingManualOverride: false,
      waitTime: null,
      wouldReturn: true,
      wouldRecommend: true,
      text: "yum",
      visitDate: "2024-06-10",
      tags: [],
      createdAt: "2024-06-10",
    },
    {
      id: "rev2",
      userId: "u1",
      restaurantId: "r2",
      rating: 9,
      ratingValue: 9,
      ratingMax: 10,
      normalizedRating: 90,
      visibility: "private",
      categoryScores: { foodQuality: 9, service: 9, atmosphere: 9, value: 9 },
      ratingManualOverride: false,
      waitTime: null,
      wouldReturn: true,
      wouldRecommend: true,
      text: "wow",
      visitDate: "2024-07-05",
      tags: [],
      createdAt: "2024-07-05",
    },
  ];
  const restaurants: Restaurant[] = [
    {
      id: "r1",
      name: "A",
      address: "",
      city: "LA",
      cuisine: "Mexican",
      priceLevel: 2,
      imageUrl: null,
      googlePlaceId: null,
      latitude: 34,
      longitude: -118,
      createdAt: "2024-01-01",
    },
    {
      id: "r2",
      name: "B",
      address: "",
      city: "SF",
      cuisine: "Italian",
      priceLevel: 3,
      imageUrl: null,
      googlePlaceId: null,
      latitude: null,
      longitude: null,
      createdAt: "2024-01-01",
    },
  ];
  const dishes: Dish[] = [];
  const photos: ReviewPhoto[] = [];

  it("builds entries with visibility and normalized rating", () => {
    const entries = getFoodJournalEntries("u1", reviews, restaurants, dishes, photos);
    expect(entries).toHaveLength(2);
    expect(entries[0].visibility).toBe("private");
    expect(entries[0].normalized_rating).toBe(90);
    expect(entries[1].rating_value).toBe(8);
  });

  it("groups by month with 1–10 average", () => {
    const months = groupJournalByMonth(
      getFoodJournalEntries("u1", reviews, restaurants, dishes, photos),
    );
    expect(months[0].month_key).toBe("2024-07");
    expect(months[0].average_rating).toBe(9);
  });

  it("computes stats and map pin availability", () => {
    const entries = getFoodJournalEntries("u1", reviews, restaurants, dishes, photos);
    const stats = getFoodJournalStats(entries);
    expect(stats.restaurantsVisited).toBe(2);
    expect(stats.cuisinesTried).toBe(2);
    expect(stats.cities).toBe(2);
    expect(stats.averageRating).toBe(8.5);
    expect(journalHasMapPins(entries)).toBe(true);
  });

  // Food Wrapped ships later — restore when the feature launches
  // it("shows wrapped promo only with enough data", () => {
  //   expect(shouldShowWrappedPromo(2)).toBe(false);
  //   expect(shouldShowWrappedPromo(3)).toBe(true);
  // });
});
