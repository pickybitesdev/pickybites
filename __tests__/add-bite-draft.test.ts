import {
  ADD_BITE_MAX_DISHES,
  ADD_BITE_RATING_SCORE_HINT,
  ADD_BITE_VISIBILITY_OPTIONS,
  addBiteDisplayProgress,
  addBiteVisibilityLabel,
  coerceAddBiteVisibility,
  createEmptyDishDraft,
  createEmptyDraft,
  createReviewDraft,
  dishesReadyForSubmit,
  draftIsPopulated,
  isNewPostPrivate,
  newPostJournalSubcopy,
  newPostSubmitLabel,
  stepIndex,
  ADD_BITE_STEPS,
} from "@/lib/add-bite-draft";
import {
  buildRecentRestaurantItems,
  createMissingPlace,
  mapNearbyPlacesToItems,
  pickItemSelectionKey,
  placeToPickItem,
} from "@/lib/add-bite-restaurant-sources";
import type { Bookmark, Restaurant, Review } from "@/lib/types";
import type { PlaceResult } from "@/lib/places/types";

describe("add-bite-draft", () => {
  it("starts empty and not populated", () => {
    const d = createEmptyDraft();
    expect(d.mode).toBe("entry");
    expect(d.visibility).toBe("friends");
    expect(d.saveToBites).toBe(true);
    expect(d.skipCompare).toBe(true);
    expect(d.ratingMax).toBe(10);
    expect(d.ratingChosen).toBe(false);
    expect(draftIsPopulated(d)).toBe(false);
  });

  it("detects populated drafts", () => {
    const d = createEmptyDraft();
    d.restaurantName = "Sushi Place";
    expect(draftIsPopulated(d)).toBe(true);
  });

  it("keeps legacy step order helpers for older drafts", () => {
    expect(ADD_BITE_STEPS[0]).toBe("restaurant");
    expect(ADD_BITE_STEPS[ADD_BITE_STEPS.length - 1]).toBe("preview");
    expect(stepIndex("visibility")).toBeGreaterThan(stepIndex("rating"));
  });

  it("createReviewDraft lands on New Post compose defaults", () => {
    const d = createReviewDraft();
    expect(d.mode).toBe("review");
    expect(d.visibility).toBe("friends");
    expect(d.saveToBites).toBe(true);
    expect(d.skipCompare).toBe(true);
    expect(d.ratingMax).toBe(10);
    expect(d.ratingChosen).toBe(false);
  });
});

describe("add-bite launch visibility", () => {
  it("offers only Bites-only and friends (no public for v1)", () => {
    expect(ADD_BITE_VISIBILITY_OPTIONS.map((o) => o.key)).toEqual(["private", "friends"]);
    expect(ADD_BITE_VISIBILITY_OPTIONS.map((o) => o.title)).toEqual([
      "Only in my Bites",
      "Share with friends",
    ]);
  });

  it("coerces legacy public to friends", () => {
    expect(coerceAddBiteVisibility("public")).toBe("friends");
    expect(coerceAddBiteVisibility("friends")).toBe("friends");
    expect(coerceAddBiteVisibility("private")).toBe("private");
  });

  it("labels visibility for private toggle / preview", () => {
    expect(addBiteVisibilityLabel("private")).toBe("Only in my Bites");
    expect(addBiteVisibilityLabel("friends")).toBe("Share with friends");
    expect(addBiteVisibilityLabel("public")).toBe("Share with friends");
    expect(isNewPostPrivate("private")).toBe(true);
    expect(newPostSubmitLabel("private")).toBe("Save to Bites");
    expect(newPostSubmitLabel("friends")).toBe("Share to Feed");
  });

  it("includes rating score privacy hint", () => {
    expect(ADD_BITE_RATING_SCORE_HINT).toMatch(/PickyBites rating/i);
    expect(ADD_BITE_RATING_SCORE_HINT).toMatch(/private/i);
  });

  it("explains journal off vs private", () => {
    expect(newPostJournalSubcopy({ saveToBites: false, isPrivate: false })).toMatch(/not saved in Bites/i);
  });
});

describe("optional dish ratings on New Post", () => {
  it("caps optional dishes so compose stays light", () => {
    expect(ADD_BITE_MAX_DISHES).toBe(5);
  });

  it("starts dish drafts empty and skips blank names on submit", () => {
    expect(createEmptyDishDraft()).toMatchObject({
      name: "",
      ratingValue: 8,
      notes: "",
      isBestDish: false,
    });
    expect(dishesReadyForSubmit([createEmptyDishDraft(), { ...createEmptyDishDraft(), name: "   " }])).toEqual(
      [],
    );
  });

  it("maps named dishes with 1–10 scores and marks the first as best", () => {
    const out = dishesReadyForSubmit([
      { name: "  Pasta  ", ratingValue: 9, notes: "spicy", isBestDish: false, photoUri: null },
      { name: "Tiramisu", ratingValue: 7, notes: "", isBestDish: true, photoUri: null },
      { name: "", ratingValue: 10, notes: "", isBestDish: false, photoUri: null },
    ]);
    expect(out).toEqual([
      {
        name: "Pasta",
        rating: 9,
        ratingValue: 9,
        ratingMax: 10,
        notes: "spicy",
        photoUrl: null,
        isBestDish: true,
      },
      {
        name: "Tiramisu",
        rating: 7,
        ratingValue: 7,
        ratingMax: 10,
        notes: "",
        photoUrl: null,
        isBestDish: false,
      },
    ]);
  });

  it("treats named dishes as populated draft content", () => {
    const d = createEmptyDraft();
    d.dishes = [{ ...createEmptyDishDraft(), name: "Ramen" }];
    expect(draftIsPopulated(d)).toBe(true);
  });
});

describe("addBiteDisplayProgress (legacy wizard)", () => {
  it("still maps restaurant to Step 1 of 6", () => {
    expect(addBiteDisplayProgress("restaurant")).toEqual({ step: 1, total: 6 });
  });

  it("maps visibility and preview to Step 6 of 6", () => {
    expect(addBiteDisplayProgress("visibility")).toEqual({ step: 6, total: 6 });
    expect(addBiteDisplayProgress("preview")).toEqual({ step: 6, total: 6 });
  });

  it("maps middle steps correctly", () => {
    expect(addBiteDisplayProgress("rating").step).toBe(2);
    expect(addBiteDisplayProgress("compare").step).toBe(5);
  });
});

describe("add-bite-restaurant-sources", () => {
  const rest = (partial: Partial<Restaurant> & { id: string; name: string }): Restaurant => ({
    address: "1 Main",
    city: "Houston",
    cuisine: "Italian",
    priceLevel: 2,
    imageUrl: null,
    createdAt: "2024-01-01",
    ...partial,
  });

  it("builds recent from reviews and bookmarks, newest first", () => {
    const restaurants = [
      rest({ id: "r1", name: "Old Spot" }),
      rest({ id: "r2", name: "New Spot" }),
    ];
    const reviews: Review[] = [
      {
        id: "rev1",
        userId: "me",
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
        text: "",
        visitDate: "2024-01-01",
        tags: [],
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];
    const bookmarks: Bookmark[] = [
      {
        id: "b1",
        userId: "me",
        restaurantId: "r2",
        googlePlaceId: null,
        placeName: "New Spot",
        placeAddress: "",
        placeCity: "Houston",
        placeCuisine: "Italian",
        placePriceLevel: 2,
        placeImageUrl: null,
        latitude: null,
        longitude: null,
        status: "want_to_try",
        reasonSaved: "",
        plannedAt: null,
        visitedAt: null,
        createdAt: "2024-06-01T00:00:00Z",
        updatedAt: "2024-06-01T00:00:00Z",
      },
    ];
    const items = buildRecentRestaurantItems("me", restaurants, reviews, bookmarks);
    expect(items.map((i) => i.name)).toEqual(["New Spot", "Old Spot"]);
  });

  it("maps nearby places and createMissingPlace", () => {
    const places: PlaceResult[] = [
      {
        googlePlaceId: "g1",
        name: "Island Grill",
        address: "1 Main",
        city: "Houston",
        cuisine: "Mediterranean",
        priceLevel: 2,
        imageUrl: null,
        latitude: 29.76,
        longitude: -95.37,
      },
    ];
    const items = mapNearbyPlacesToItems(places, [], [], { latitude: 29.76, longitude: -95.37 });
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Island Grill");
    expect(pickItemSelectionKey(items[0])).toBe("place:g1");

    const missing = createMissingPlace({ name: "My Spot", city: "Austin" });
    expect(missing.name).toBe("My Spot");
    expect(missing.googlePlaceId.startsWith("manual:")).toBe(true);
    expect(placeToPickItem(missing).place?.name).toBe("My Spot");
  });
});
