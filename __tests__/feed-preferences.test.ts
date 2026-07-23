import {
  DEFAULT_FEED_PREFERENCES,
  countActiveFeedFilters,
  hasActiveFeedFilters,
  summarizeFeedFilters,
} from "@/lib/feed-preferences";
import { canViewBiteReview } from "@/lib/bite-access";

describe("feed preference helpers", () => {
  it("counts and summarizes active filters", () => {
    expect(countActiveFeedFilters(DEFAULT_FEED_PREFERENCES)).toBe(0);
    expect(hasActiveFeedFilters(DEFAULT_FEED_PREFERENCES)).toBe(false);
    expect(summarizeFeedFilters(DEFAULT_FEED_PREFERENCES)).toEqual([]);

    const prefs = {
      ...DEFAULT_FEED_PREFERENCES,
      sort: "best_match" as const,
      cuisineOverrides: ["Italian" as const, "Thai" as const],
      priceLevels: [2 as const, 3 as const],
      distance: "5mi" as const,
    };
    expect(countActiveFeedFilters(prefs)).toBe(4);
    expect(hasActiveFeedFilters(prefs)).toBe(true);
    expect(summarizeFeedFilters(prefs)).toEqual([
      "Best match",
      "2 cuisines",
      "$$ · $$$",
      "Up to 5 mi",
    ]);
  });
});

describe("canViewBiteReview", () => {
  it("allows owner always", () => {
    expect(
      canViewBiteReview({
        reviewUserId: "me",
        visibility: "private",
        currentUserId: "me",
        isFollowingAuthor: false,
      }),
    ).toBe(true);
  });

  it("allows public for anyone", () => {
    expect(
      canViewBiteReview({
        reviewUserId: "them",
        visibility: "public",
        currentUserId: "me",
        isFollowingAuthor: false,
      }),
    ).toBe(true);
  });

  it("allows friends visibility only when following", () => {
    expect(
      canViewBiteReview({
        reviewUserId: "them",
        visibility: "friends",
        currentUserId: "me",
        isFollowingAuthor: false,
      }),
    ).toBe(false);
    expect(
      canViewBiteReview({
        reviewUserId: "them",
        visibility: "friends",
        currentUserId: "me",
        isFollowingAuthor: true,
      }),
    ).toBe(true);
  });
});
