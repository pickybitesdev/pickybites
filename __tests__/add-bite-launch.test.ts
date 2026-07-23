import { ADD_BITE_HREF } from "@/lib/add-actions";
import {
  ADD_BITE_MAX_PHOTOS,
  ADD_BITE_RATING_SCORE_HINT,
  ADD_BITE_VISIBILITY_OPTIONS,
  coerceAddBiteVisibility,
  createEmptyDraft,
  createReviewDraft,
  hasChosenNewPostRating,
  isNewPostPrivate,
  newPostJournalSubcopy,
  newPostPrivateSubcopy,
  newPostSubmitLabel,
} from "@/lib/add-bite-draft";
import { isScoreEligibleVisibility, getPickyBitesScore } from "@/lib/pickybites-score";
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

describe("+ button New Post compose contracts", () => {
  it("opens Add a Bite (not legacy add-review)", () => {
    expect(ADD_BITE_HREF).toBe("/add-bite");
    expect(createReviewDraft().mode).toBe("review");
  });

  it("defaults to friends visibility, journal on, compare skipped, rating unchosen", () => {
    const d = createReviewDraft();
    expect(d.visibility).toBe("friends");
    expect(d.saveToBites).toBe(true);
    expect(d.skipCompare).toBe(true);
    expect(d.ratingMax).toBe(10);
    expect(d.ratingChosen).toBe(false);
  });

  it("maps private toggle to Bites-only vs friends", () => {
    expect(isNewPostPrivate("private")).toBe(true);
    expect(isNewPostPrivate("friends")).toBe(false);
    expect(newPostPrivateSubcopy(true)).toBe("Only in my Bites");
    expect(newPostPrivateSubcopy(false)).toBe("Friends see this on Feed");
    expect(ADD_BITE_VISIBILITY_OPTIONS.map((o) => o.key)).toEqual(["private", "friends"]);
  });

  it("clarifies journal-off feed-only behavior", () => {
    expect(newPostJournalSubcopy({ saveToBites: false, isPrivate: false })).toMatch(/Feed only/i);
    expect(newPostJournalSubcopy({ saveToBites: true, isPrivate: false })).toMatch(/Bites/i);
    expect(newPostJournalSubcopy({ saveToBites: false, isPrivate: true })).toMatch(/journal/i);
    expect(hasChosenNewPostRating(createReviewDraft())).toBe(false);
    expect(hasChosenNewPostRating({ ratingChosen: true })).toBe(true);
  });

  it("CTA label depends on private toggle", () => {
    expect(newPostSubmitLabel("friends")).toBe("Share to Feed");
    expect(newPostSubmitLabel("private")).toBe("Save to Bites");
    expect(newPostSubmitLabel("public")).toBe("Share to Feed");
  });

  it("private rating does not move public PickyBites score; friends does", () => {
    expect(isScoreEligibleVisibility("private")).toBe(false);
    expect(isScoreEligibleVisibility("friends")).toBe(true);

    const score = getPickyBitesScore(
      "r1",
      [
        rev({
          id: "priv",
          restaurantId: "r1",
          ratingValue: 10,
          ratingMax: 10,
          visibility: "private",
        }),
        rev({
          id: "fr",
          restaurantId: "r1",
          ratingValue: 5,
          ratingMax: 10,
          visibility: "friends",
        }),
      ],
      70,
      5,
    );
    expect(score.reviewCount).toBe(1);
    expect(score.averageNormalized).toBe(50);
  });

  it("optional compare can be skipped without blocking submit", () => {
    const draft = createEmptyDraft();
    expect(draft.skipCompare).toBe(true);
    const comparison =
      !draft.skipCompare && draft.compareRestaurantId && draft.comparePreference
        ? { comparedRestaurantId: draft.compareRestaurantId }
        : undefined;
    expect(comparison).toBeUndefined();
  });

  it("rating hint and photo limit match compose UX", () => {
    expect(ADD_BITE_RATING_SCORE_HINT).toMatch(/PickyBites rating/i);
    expect(ADD_BITE_MAX_PHOTOS).toBe(8);
  });

  it("coerces legacy public drafts to friends", () => {
    expect(coerceAddBiteVisibility("public")).toBe("friends");
  });
});
