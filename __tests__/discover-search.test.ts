import {
  insertSelectedRestaurant,
  resolvedPlaceToPlaceResult,
  restaurantToPlaceResult,
  cameraTargetForResolvedPlace,
  isRestaurantSearchResult,
  areaNearLabelFromResolved,
  searchRadiusForResolvedPlace,
  CITY_SEARCH_RADIUS_METERS,
} from "@/lib/discover-search";
import type { ResolvedSearchPlace } from "@/lib/places/autocomplete";
import type { PlaceResult } from "@/lib/places/types";
import type { Restaurant } from "@/lib/types";
import { DISCOVER_RESULT_LIMIT } from "@/lib/discover-results";

function place(id: string, name = id): PlaceResult {
  return {
    googlePlaceId: id,
    name,
    address: "1 Main",
    city: "Houston",
    cuisine: "American",
    priceLevel: 2,
    priceLevelKnown: true,
    imageUrl: null,
    latitude: 29.7,
    longitude: -95.4,
    openNow: true,
  };
}

function resolved(partial: Partial<ResolvedSearchPlace> & Pick<ResolvedSearchPlace, "placeId" | "name" | "kind">): ResolvedSearchPlace {
  return {
    address: "Houston, TX",
    city: "Houston",
    latitude: 29.76,
    longitude: -95.36,
    cuisineTypes: partial.kind === "restaurant" ? ["restaurant"] : ["locality"],
    primaryType: partial.kind === "restaurant" ? "restaurant" : "locality",
    imageUrl: null,
    priceLevel: null,
    openNow: null,
    viewport: null,
    ...partial,
  };
}

describe("insertSelectedRestaurant", () => {
  it("inserts at front, dedupes, and caps at 15", () => {
    const many = Array.from({ length: 20 }, (_, i) => place(`p${i}`));
    const selected = place("exact", "Exact Spot");
    const next = insertSelectedRestaurant(many, selected);
    expect(next).toHaveLength(DISCOVER_RESULT_LIMIT);
    expect(next[0].googlePlaceId).toBe("exact");
    expect(next.filter((p) => p.googlePlaceId === "exact")).toHaveLength(1);
  });

  it("does not duplicate when already present", () => {
    const list = [place("a"), place("b"), place("exact")];
    const next = insertSelectedRestaurant(list, place("exact", "Exact"));
    expect(next.map((p) => p.googlePlaceId)).toEqual(["exact", "a", "b"]);
  });
});

describe("resolved search mapping", () => {
  it("maps restaurant resolved place and classifies as restaurant", () => {
    const r = resolved({
      placeId: "rest-1",
      name: "Taqueria",
      kind: "restaurant",
      cuisineTypes: ["mexican_restaurant", "restaurant"],
      primaryType: "mexican_restaurant",
    });
    expect(isRestaurantSearchResult(r)).toBe(true);
    const placeResult = resolvedPlaceToPlaceResult(r);
    expect(placeResult.googlePlaceId).toBe("rest-1");
    expect(placeResult.name).toBe("Taqueria");
    expect(placeResult.latitude).toBe(29.76);
  });

  it("builds tighter camera for restaurants than cities", () => {
    const restaurant = cameraTargetForResolvedPlace(
      resolved({ placeId: "r", name: "Spot", kind: "restaurant" }),
      1,
    );
    const city = cameraTargetForResolvedPlace(
      resolved({
        placeId: "c",
        name: "Austin",
        kind: "area",
        cuisineTypes: ["locality"],
      }),
      2,
    );
    expect(restaurant.latitudeDelta).toBeLessThan(city.latitudeDelta);
    expect(city.latitudeDelta).toBeGreaterThan(0.1);
  });

  it("uses viewport when present", () => {
    const target = cameraTargetForResolvedPlace(
      resolved({
        placeId: "v",
        name: "Neighborhood",
        kind: "area",
        viewport: {
          low: { latitude: 29.7, longitude: -95.5 },
          high: { latitude: 29.8, longitude: -95.3 },
        },
      }),
      3,
    );
    expect(target.latitude).toBeCloseTo(29.75);
    expect(target.longitude).toBeCloseTo(-95.4);
    expect(target.latitudeDelta).toBeGreaterThan(0.1);
  });

  it("builds area near label but not for restaurants", () => {
    expect(
      areaNearLabelFromResolved(
        resolved({ placeId: "a", name: "Briar Forest", kind: "area", city: "Houston" }),
      ),
    ).toBe("Near Briar Forest, Houston");
    expect(
      areaNearLabelFromResolved(
        resolved({ placeId: "r", name: "Chipotle", kind: "restaurant" }),
      ),
    ).toBeNull();
  });

  it("uses a city-scale radius for area jumps", () => {
    expect(
      searchRadiusForResolvedPlace(
        resolved({ placeId: "nyc", name: "New York", kind: "area", cuisineTypes: ["locality"] }),
      ),
    ).toBe(CITY_SEARCH_RADIUS_METERS);
    expect(
      searchRadiusForResolvedPlace(
        resolved({ placeId: "r", name: "Spot", kind: "restaurant" }),
      ),
    ).toBeLessThan(CITY_SEARCH_RADIUS_METERS);
  });
});

describe("restaurantToPlaceResult", () => {
  it("maps a rated restaurant into a PlaceResult for tray insert", () => {
    const restaurant: Restaurant = {
      id: "rest-db-1",
      googlePlaceId: "gp-1",
      name: "Rated Spot",
      address: "100 Main",
      city: "Houston",
      cuisine: "Italian",
      priceLevel: 3,
      imageUrl: null,
      latitude: 29.75,
      longitude: -95.37,
      createdAt: "2024-01-01",
    };
    const mapped = restaurantToPlaceResult(restaurant);
    expect(mapped).toEqual(
      expect.objectContaining({
        googlePlaceId: "gp-1",
        name: "Rated Spot",
        latitude: 29.75,
        longitude: -95.37,
        priceLevelKnown: true,
      }),
    );
  });

  it("returns null without coordinates", () => {
    const restaurant: Restaurant = {
      id: "rest-db-2",
      googlePlaceId: "gp-2",
      name: "No Coords",
      address: "100 Main",
      city: "Houston",
      cuisine: "Italian",
      priceLevel: 2,
      imageUrl: null,
      latitude: null,
      longitude: null,
      createdAt: "2024-01-01",
    };
    expect(restaurantToPlaceResult(restaurant)).toBeNull();
  });

  it("falls back to restaurant id when googlePlaceId is missing", () => {
    const restaurant: Restaurant = {
      id: "rest-db-3",
      googlePlaceId: null,
      name: "Local Only",
      address: "100 Main",
      city: "Houston",
      cuisine: "American",
      priceLevel: 2,
      imageUrl: null,
      latitude: 29.7,
      longitude: -95.4,
      createdAt: "2024-01-01",
    };
    expect(restaurantToPlaceResult(restaurant)?.googlePlaceId).toBe("rest-db-3");
  });
});
