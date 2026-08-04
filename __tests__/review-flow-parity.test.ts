/**
 * Guards the create/edit parity fix.
 *
 * `add-bite` (create) always submitted waitTime, wouldReturn, wouldRecommend,
 * visitDate and tags — but had no UI for them, so they went through as
 * defaults. Only the edit screen could set them. These tests lock the shared
 * field set so the two flows cannot drift apart again.
 */
import { VisitDetailsFields } from "@/components/reviews/VisitDetailsFields";
import { createEmptyDraft } from "@/lib/add-bite-draft";
import { createStructuredRatingState } from "@/components/reviews/StructuredRatingForm";

describe("review flow parity", () => {
  it("the draft carries every shared visit-detail field", () => {
    const draft = createEmptyDraft();
    for (const key of ["waitTime", "wouldReturn", "wouldRecommend", "visitDate", "tags"]) {
      expect(draft).toHaveProperty(key);
    }
  });

  it("defaults leave the optional visit details unset rather than guessing", () => {
    const draft = createEmptyDraft();
    expect(draft.waitTime).toBeNull();
    expect(draft.wouldReturn).toBeNull();
    expect(draft.wouldRecommend).toBeNull();
    expect(draft.tags).toEqual([]);
  });

  it("defaults the visit date to today so a skipped field is still accurate", () => {
    expect(createEmptyDraft().visitDate).toBe(new Date().toISOString().slice(0, 10));
  });

  it("the rating state exposes the same three opinion fields as the draft", () => {
    const state = createStructuredRatingState();
    const draft = createEmptyDraft();
    for (const key of ["waitTime", "wouldReturn", "wouldRecommend"] as const) {
      expect(state[key]).toBe(draft[key]);
    }
  });

  it("exports one shared field component for both flows to render", () => {
    expect(typeof VisitDetailsFields).toBe("function");
  });
});

describe("category scores on create", () => {
  // New Post used to copy the overall score into all four categories and flag
  // it a manual override, so every created review carried four identical
  // fabricated scores that looked like real per-category data.
  it("starts with categories opt-out so nothing is claimed by default", () => {
    expect(createEmptyDraft().includeCategories).toBe(false);
  });

  it("carries a category score object the edit screen can also read", () => {
    const draft = createEmptyDraft();
    for (const key of ["foodQuality", "service", "atmosphere", "value"] as const) {
      expect(typeof draft.categoryScores[key]).toBe("number");
    }
  });

  it("uses the same category keys as the shared rating state", () => {
    expect(Object.keys(createEmptyDraft().categoryScores).sort()).toEqual(
      Object.keys(createStructuredRatingState().categoryScores).sort(),
    );
  });
});
