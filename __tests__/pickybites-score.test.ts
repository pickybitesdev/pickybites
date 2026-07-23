import { getPickyBitesScore } from "@/lib/pickybites-score";
import type { Review } from "@/lib/types";

function rev(
  partial: Partial<Review> & {
    id: string;
    restaurantId: string;
    ratingValue: number;
    ratingMax: number;
    visibility?: Review["visibility"];
  },
): Review {
  const normalized =
    partial.normalizedRating ??
    Math.round((partial.ratingValue / partial.ratingMax) * 10000) / 100;
  return {
    userId: "u1",
    rating: Math.min(10, Math.max(1, normalized / 10)),
    categoryScores: { foodQuality: 8, service: 8, atmosphere: 8, value: 8 },
    ratingManualOverride: true,
    waitTime: null,
    wouldReturn: true,
    wouldRecommend: true,
    text: "",
    visitDate: "2024-01-01",
    tags: [],
    createdAt: "2024-01-01T00:00:00Z",
    visibility: "friends",
    ...partial,
    ratingValue: partial.ratingValue,
    ratingMax: partial.ratingMax,
    normalizedRating: normalized,
  };
}

describe("pickybites-score", () => {
  it("uses normalized ratings only — never averages raw different scales", () => {
    const reviews = [
      rev({ id: "a", restaurantId: "r1", ratingValue: 9, ratingMax: 12 }), // 75
      rev({ id: "b", restaurantId: "r1", ratingValue: 44, ratingMax: 58 }), // 75.86
    ];
    const score = getPickyBitesScore("r1", reviews, 70, 5);
    expect(score.averageNormalized).toBeCloseTo((75 + 75.86) / 2, 1);
    // Wrong approach would average (9+44)/(12+58) or mean of raw values
    const wrongRawAverage = (9 + 44) / 2;
    expect(score.averageNormalized).not.toBeCloseTo(wrongRawAverage, 0);
  });

  it("excludes private reviews from community score", () => {
    const reviews = [
      rev({
        id: "priv",
        restaurantId: "r1",
        ratingValue: 100,
        ratingMax: 100,
        visibility: "private",
      }),
      rev({
        id: "pub",
        restaurantId: "r1",
        ratingValue: 80,
        ratingMax: 100,
        visibility: "friends",
      }),
    ];
    const score = getPickyBitesScore("r1", reviews, 70, 5);
    expect(score.reviewCount).toBe(1);
    expect(score.averageNormalized).toBe(80);
  });

  it("applies Bayesian prior on 0–100 scale", () => {
    const reviews = [rev({ id: "a", restaurantId: "r1", ratingValue: 87, ratingMax: 100 })];
    const score = getPickyBitesScore("r1", reviews, 70, 5);
    // (87*1 + 70*5) / 6 = 72.833...
    expect(score.weightedScore).toBeCloseTo((87 + 70 * 5) / 6, 1);
  });
});
