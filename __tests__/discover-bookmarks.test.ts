import { bookmarkedGooglePlaceIds } from "@/lib/discover-bookmarks";

describe("bookmarkedGooglePlaceIds", () => {
  it("collects place ids so Discover can refresh Saved / Try Next UI", () => {
    const ids = bookmarkedGooglePlaceIds([
      { googlePlaceId: "chipotle-1" },
      { googlePlaceId: null },
      { googlePlaceId: "sushi-2" },
      {},
    ]);
    expect([...ids].sort()).toEqual(["chipotle-1", "sushi-2"]);
  });

  it("returns a new set when bookmarks change (memo busting)", () => {
    const a = bookmarkedGooglePlaceIds([{ googlePlaceId: "a" }]);
    const b = bookmarkedGooglePlaceIds([{ googlePlaceId: "a" }, { googlePlaceId: "b" }]);
    expect(a.has("b")).toBe(false);
    expect(b.has("b")).toBe(true);
  });
});
