import {
  RATING_SCALE_PRESETS,
  buildNormalizedRating,
  formatTenPointScore,
  formatUserRating,
  legacyTenPointFromNormalized,
  normalizeRating,
  tenPointFromNormalized,
  validateRatingScale,
} from "@/lib/rating-scale";

describe("rating-scale", () => {
  it("normalizes common examples", () => {
    expect(normalizeRating(9, 12)).toBe(75);
    expect(normalizeRating(44, 58)).toBe(75.86);
    expect(normalizeRating(87, 100)).toBe(87);
  });

  it("rejects invalid max and value > max", () => {
    expect(validateRatingScale(3, 4).ok).toBe(false);
    expect(validateRatingScale(3, 1001).ok).toBe(false);
    expect(validateRatingScale(11, 10).ok).toBe(false);
    expect(validateRatingScale(9, 12).ok).toBe(true);
  });

  it("exposes presets and formats user-facing rating", () => {
    expect(RATING_SCALE_PRESETS).toEqual([5, 10, 12, 100]);
    expect(formatUserRating(9, 12)).toBe("9 / 12");
    expect(buildNormalizedRating(9, 12)).toEqual({
      ratingValue: 9,
      ratingMax: 12,
      normalizedRating: 75,
    });
  });

  it("maps normalized score to legacy 1–10", () => {
    expect(legacyTenPointFromNormalized(75)).toBe(7.5);
    expect(legacyTenPointFromNormalized(0)).toBe(1);
    expect(legacyTenPointFromNormalized(100)).toBe(10);
  });

  it("maps normalized score to display /10", () => {
    expect(tenPointFromNormalized(89)).toBe(8.9);
    expect(tenPointFromNormalized(0)).toBe(0);
    expect(tenPointFromNormalized(100)).toBe(10);
    expect(formatTenPointScore(89)).toBe("8.9/10");
    expect(formatTenPointScore(90)).toBe("9/10");
  });
});
