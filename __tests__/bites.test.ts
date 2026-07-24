import {
  BITES_SEGMENTS,
  bitesCollectionIsEmpty,
  bitesHref,
  getBitesCollections,
  selectBitesVisited,
  selectBitesWantToTry,
  visitedBookmarks,
  wantToTryBookmarkLabel,
} from "@/lib/bites";
import type { Bookmark } from "@/lib/types";

function makeBookmark(overrides: Partial<Bookmark>): Bookmark {
  return {
    id: "b1",
    userId: "user-1",
    restaurantId: "r1",
    googlePlaceId: "g1",
    placeName: "Taco Spot",
    placeAddress: "1 Main St",
    placeCity: "Los Angeles",
    placeCuisine: "Mexican",
    placePriceLevel: 2,
    placeImageUrl: null,
    latitude: 34.05,
    longitude: -118.24,
    status: "want_to_try",
    reasonSaved: "Heard great things",
    plannedAt: null,
    visitedAt: null,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
    createdVia: "in_app",
    resolutionStatus: "linked",
    sourcePlatform: null,
    primarySourceTitle: null,
    primarySourceThumbnailUrl: null,
    sources: [],
    ...overrides,
  };
}

describe("bites collection selection", () => {
  const want = makeBookmark({ id: "want", status: "want_to_try", placeName: "Want Spot" });
  const planned = makeBookmark({ id: "planned", status: "planned", placeName: "Planned Spot" });
  const visited = makeBookmark({
    id: "visited",
    status: "visited",
    placeName: "Visited Spot",
    visitedAt: "2024-07-01T00:00:00Z",
  });

  it("includes journal in segments and defaults labels", () => {
    expect(BITES_SEGMENTS.map((s) => s.value)).toEqual(["journal", "want_to_try", "lists"]);
    expect(BITES_SEGMENTS.map((s) => s.label)).toEqual(["Journal", "Try Next", "Lists"]);
  });

  it("builds deep links and Try Next bookmark labels", () => {
    expect(bitesHref("want_to_try")).toEqual({
      pathname: "/(tabs)/bites",
      params: { segment: "want_to_try" },
    });
    expect(wantToTryBookmarkLabel(false)).toBe("Save to Try Next");
    expect(wantToTryBookmarkLabel(true)).toBe("Remove from Try Next");
  });

  it("puts unvisited saves in Try Next and keeps visited separately", () => {
    const olderVisited = makeBookmark({
      id: "visited-old",
      status: "visited",
      placeName: "Older",
      visitedAt: "2024-06-01T00:00:00Z",
    });
    const collections = getBitesCollections([want, planned, visited, olderVisited]);
    expect(collections.wantToTry.map((b) => b.id)).toEqual(["want", "planned"]);
    expect(selectBitesWantToTry(collections).map((b) => b.id)).toEqual(["want", "planned"]);
    expect(collections.visited.map((b) => b.id)).toEqual(["visited", "visited-old"]);
    expect(selectBitesVisited(collections).map((b) => b.id)).toEqual(["visited", "visited-old"]);
    expect(visitedBookmarks([want, visited, olderVisited]).map((b) => b.id)).toEqual([
      "visited",
      "visited-old",
    ]);
  });

  it("treats Bites as empty only when all collections are empty", () => {
    expect(bitesCollectionIsEmpty(getBitesCollections([]), 0, 0)).toBe(true);
    expect(bitesCollectionIsEmpty(getBitesCollections([want]), 0, 0)).toBe(false);
    expect(bitesCollectionIsEmpty(getBitesCollections([visited]), 0, 0)).toBe(false);
    expect(bitesCollectionIsEmpty(getBitesCollections([]), 2, 0)).toBe(false);
    expect(bitesCollectionIsEmpty(getBitesCollections([]), 0, 1)).toBe(false);
  });
});
