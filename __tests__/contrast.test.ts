import { brandColors } from "@/constants/branding";
import { contrastRatio, meetsWcagAa } from "@/lib/contrast";

describe("contrast helpers", () => {
  it("computes a symmetric contrast ratio", () => {
    const a = contrastRatio("#FFFFFF", "#000000");
    const b = contrastRatio("#000000", "#FFFFFF");
    expect(a).toBeCloseTo(21, 0);
    expect(b).toBeCloseTo(a, 5);
  });

  it("uses primaryPressed for solid CTAs so white text meets AA large (≥ 3:1)", () => {
    const ratio = contrastRatio("#FFFFFF", brandColors.primaryPressed);
    expect(ratio).toBeGreaterThanOrEqual(3);
    expect(meetsWcagAa("#FFFFFF", brandColors.primaryPressed, true)).toBe(true);
  });

  it("documents that bright primary is for accents, not small white-on-coral captions", () => {
    const bright = contrastRatio("#FFFFFF", brandColors.primary);
    const pressed = contrastRatio("#FFFFFF", brandColors.primaryPressed);
    expect(pressed).toBeGreaterThan(bright);
    expect(bright).toBeLessThan(3);
  });

  it("keeps secondary text readable on app background", () => {
    expect(
      meetsWcagAa(brandColors.textSecondary, brandColors.background, false),
    ).toBe(true);
  });

  it("keeps primary text readable on white surfaces", () => {
    expect(meetsWcagAa(brandColors.textPrimary, brandColors.surface, false)).toBe(true);
  });

  it("does not treat small coral text on white as AA normal text", () => {
    // Coral is an accent — body copy must use textPrimary/textSecondary instead.
    expect(meetsWcagAa(brandColors.primary, brandColors.surface, false)).toBe(false);
  });
});
