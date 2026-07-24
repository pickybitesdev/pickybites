import {
  ADD_BITE_HREF,
  ADD_ACTIONS,
  addBiteHref,
  createPrefillDraft,
  draftWithRestaurantPrefill,
  placeResultFromBookmark,
} from "@/lib/add-actions";
import { createEmptyDraft } from "@/lib/add-bite-draft";
import type { Bookmark, Restaurant } from "@/lib/types";

describe("center plus / add workflows", () => {
  it("primary entry is Add a Bite", () => {
    expect(ADD_BITE_HREF).toBe("/add-bite");
    expect(ADD_ACTIONS[0]).toMatchObject({
      href: "/add-bite",
      title: "Add a Bite",
    });
  });

  it("keeps Quick Dish Log as a secondary deep link", () => {
    expect(ADD_ACTIONS.map((a) => a.title)).toEqual(["Add a Bite", "Quick Dish Log"]);
    expect(ADD_ACTIONS.map((a) => a.href)).toEqual(["/add-bite", "/add-dish"]);
  });

  it("builds add-bite href with restaurant and/or bookmark prefill", () => {
    expect(addBiteHref()).toBe("/add-bite");
    expect(addBiteHref("r1")).toEqual({
      pathname: "/add-bite",
      params: { restaurantId: "r1" },
    });
    expect(addBiteHref({ restaurantId: "r1", bookmarkId: "b1" })).toEqual({
      pathname: "/add-bite",
      params: { restaurantId: "r1", bookmarkId: "b1" },
    });
    expect(addBiteHref({ bookmarkId: "b1" })).toEqual({
      pathname: "/add-bite",
      params: { bookmarkId: "b1" },
    });
  });
});

describe("visited bookmark → Add a Bite prefill", () => {
  const bookmark: Bookmark = {
    id: "b1",
    userId: "user-1",
    restaurantId: null,
    googlePlaceId: "yelp:abc",
    placeName: "Nori House",
    placeAddress: "123 Sunset",
    placeCity: "Los Angeles",
    placeCuisine: "Japanese",
    placePriceLevel: 3,
    placeImageUrl: "https://img.example/n.jpg",
    latitude: 34.05,
    longitude: -118.25,
    status: "visited",
    reasonSaved: "Saved from Discover",
    plannedAt: null,
    visitedAt: "2026-07-23T12:00:00Z",
    createdAt: "2026-07-20T12:00:00Z",
    updatedAt: "2026-07-23T12:00:00Z",
  createdVia: "in_app",
  resolutionStatus: "linked",
  sourcePlatform: null,
  primarySourceTitle: null,
  primarySourceThumbnailUrl: null,
  sources: [],
  };

  it("maps bookmark place fields into a PlaceResult", () => {
    expect(placeResultFromBookmark(bookmark)).toMatchObject({
      googlePlaceId: "yelp:abc",
      name: "Nori House",
      city: "Los Angeles",
      cuisine: "Japanese",
      latitude: 34.05,
      longitude: -118.25,
    });
  });

  it("prefills draft from bookmark when restaurant row is missing", () => {
    const draft = createPrefillDraft({ bookmark });
    expect(draft.mode).toBe("review");
    expect(draft.restaurantName).toBe("Nori House");
    expect(draft.city).toBe("Los Angeles");
    expect(draft.place?.googlePlaceId).toBe("yelp:abc");
    expect(draft.restaurantId).toBeNull();
  });

  it("prefers restaurant row when available", () => {
    const restaurant: Restaurant = {
      id: "r1",
      googlePlaceId: "yelp:abc",
      name: "Nori House Official",
      address: "123 Sunset",
      city: "Los Angeles",
      cuisine: "Japanese",
      priceLevel: 3,
      imageUrl: null,
      createdAt: "2026-01-01T00:00:00Z",
    };
    const draft = draftWithRestaurantPrefill(createEmptyDraft(), { restaurant, bookmark });
    expect(draft.restaurantId).toBe("r1");
    expect(draft.restaurantName).toBe("Nori House Official");
    expect(draft.place).toBeNull();
  });
});
