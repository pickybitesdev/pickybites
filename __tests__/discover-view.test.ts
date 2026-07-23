import {
  DEFAULT_DISCOVER_VIEW_MODE,
  DEFAULT_DISCOVER_RADIUS,
  PLACES_SIGN_IN_REQUIRED_MESSAGE,
  PLACES_UNAVAILABLE_MESSAGE,
  countActiveDiscoverFilters,
  nearYouSectionLabel,
  pickSurpriseRestaurant,
  placesMessageLeaksConfig,
  sortDiscoverPlaces,
  toggleDiscoverViewMode,
} from "@/lib/discover-view";
import { TAB_SCROLL_BOTTOM_PADDING } from "@/lib/tab-bar";

describe("discover-view", () => {
  it("defaults to map mode", () => {
    expect(DEFAULT_DISCOVER_VIEW_MODE).toBe("map");
  });

  it("toggles map and list", () => {
    expect(toggleDiscoverViewMode("map")).toBe("list");
    expect(toggleDiscoverViewMode("list")).toBe("map");
  });

  it("counts active filters", () => {
    expect(
      countActiveDiscoverFilters({
        cuisine: null,
        radiusMeters: DEFAULT_DISCOVER_RADIUS,
        curatedTab: "for-you",
      }),
    ).toBe(0);

    expect(
      countActiveDiscoverFilters({
        cuisine: "Italian",
        radiusMeters: 800,
        curatedTab: "trending",
        openNowOnly: true,
      }),
    ).toBe(4);

    expect(
      countActiveDiscoverFilters({
        cuisine: null,
        radiusMeters: DEFAULT_DISCOVER_RADIUS,
        curatedTab: "trending",
        includeCuratedTab: false,
      }),
    ).toBe(0);
  });

  it("builds list section labels from Near labels", () => {
    expect(nearYouSectionLabel(null)).toBe("Near you");
    expect(nearYouSectionLabel("Near Austin")).toBe("Austin");
    expect(nearYouSectionLabel("Houston")).toBe("Houston");
  });

  it("picks a surprise restaurant deterministically with seeded random", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(pickSurpriseRestaurant(items, () => 0)).toEqual({ id: "a" });
    expect(pickSurpriseRestaurant(items, () => 0.99)).toEqual({ id: "c" });
    expect(pickSurpriseRestaurant([], () => 0.5)).toBeNull();
  });

  it("sorts places by distance, rating, and match", () => {
    const places = [
      { googlePlaceId: "1", distanceMeters: 500, rating: 4, matchPercent: 50 },
      { googlePlaceId: "2", distanceMeters: 100, rating: 5, matchPercent: 90 },
      { googlePlaceId: "3", distanceMeters: 300, rating: 3, matchPercent: 70 },
    ];
    expect(sortDiscoverPlaces(places, "distance").map((p) => p.googlePlaceId)).toEqual(["2", "3", "1"]);
    expect(sortDiscoverPlaces(places, "rating").map((p) => p.googlePlaceId)).toEqual(["2", "1", "3"]);
    expect(sortDiscoverPlaces(places, "match").map((p) => p.googlePlaceId)).toEqual(["2", "3", "1"]);
    expect(sortDiscoverPlaces(places, "recommended").map((p) => p.googlePlaceId)).toEqual(["1", "2", "3"]);
  });

  it("uses tab clearance for tray padding", () => {
    expect(TAB_SCROLL_BOTTOM_PADDING).toBeGreaterThanOrEqual(56);
    const { trayBottomOffset, trayClearsTabBar } = require("@/lib/discover-tray");
    expect(trayBottomOffset(34)).toBeLessThanOrEqual(TAB_SCROLL_BOTTOM_PADDING);
    expect(trayClearsTabBar()).toBe(true);
  });
});

describe("places messaging", () => {
  it("production copy does not leak env config names", () => {
    expect(placesMessageLeaksConfig(PLACES_UNAVAILABLE_MESSAGE)).toBe(false);
    expect(PLACES_UNAVAILABLE_MESSAGE).toBe("Restaurant search is temporarily unavailable.");
    expect(placesMessageLeaksConfig(PLACES_SIGN_IN_REQUIRED_MESSAGE)).toBe(false);
    expect(PLACES_SIGN_IN_REQUIRED_MESSAGE).toBe("Sign in to search restaurants.");
    expect(placesMessageLeaksConfig("Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to .env")).toBe(true);
  });
});
