import {
  DISCOVER_RESULT_LIMIT,
  capDiscoverResults,
  rankAndCapDiscoverPlaces,
} from "@/lib/discover-results";
import { mergeLimitForRadius } from "@/lib/places/nearby-search";
import { MAX_MAP_MARKERS } from "@/lib/maps/pins";
import type { PlaceResult } from "@/lib/places/types";

function fakePlace(id: string): PlaceResult {
  return {
    googlePlaceId: id,
    name: id,
    address: "",
    city: "",
    cuisine: "Italian",
    priceLevel: 2,
    imageUrl: null,
    latitude: 34,
    longitude: -118,
  };
}

describe("discover results limit", () => {
  it("exports a hard limit of 15", () => {
    expect(DISCOVER_RESULT_LIMIT).toBe(15);
    expect(MAX_MAP_MARKERS).toBe(15);
    expect(mergeLimitForRadius(4828)).toBe(15);
    expect(mergeLimitForRadius(1609)).toBe(15);
    expect(mergeLimitForRadius(14000)).toBe(15);
  });

  it("never returns more than 15 from rankAndCap", () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      place: fakePlace(`p${i}`),
      distanceMeters: 1000 - i,
      rating: i % 5,
      matchPercent: i % 10,
    }));
    const capped = rankAndCapDiscoverPlaces(items);
    expect(capped).toHaveLength(15);
    expect(capped.every((x) => x.place.googlePlaceId.startsWith("p"))).toBe(true);
  });

  it("ranks by match then distance then rating", () => {
    const items = [
      { place: fakePlace("far-high-match"), distanceMeters: 900, rating: 3, matchPercent: 90 },
      { place: fakePlace("near-low-match"), distanceMeters: 100, rating: 5, matchPercent: 40 },
      { place: fakePlace("mid"), distanceMeters: 200, rating: 4, matchPercent: 90 },
    ];
    const ranked = rankAndCapDiscoverPlaces(items);
    expect(ranked.map((r) => r.place.googlePlaceId)).toEqual([
      "mid",
      "far-high-match",
      "near-low-match",
    ]);
  });

  it("capDiscoverResults slices arbitrary lists to 15", () => {
    expect(capDiscoverResults(Array.from({ length: 40 }, (_, i) => i))).toHaveLength(15);
    expect(capDiscoverResults([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
