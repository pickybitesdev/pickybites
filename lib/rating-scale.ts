/** Custom rating scale helpers for Add a Bite. */

export const RATING_MAX_MIN = 5;
export const RATING_MAX_MAX = 1000;
export const RATING_SCALE_PRESETS = [5, 10, 12, 100] as const;

export type RatingScaleInput = {
  ratingValue: number;
  ratingMax: number;
};

export type NormalizedRating = RatingScaleInput & {
  normalizedRating: number;
};

export function isValidRatingMax(max: number): boolean {
  return Number.isFinite(max) && Number.isInteger(max) && max >= RATING_MAX_MIN && max <= RATING_MAX_MAX;
}

export function isValidRatingValue(value: number, max: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= max;
}

export function validateRatingScale(
  value: number,
  max: number,
): { ok: true } | { ok: false; error: string } {
  if (!isValidRatingMax(max)) {
    return { ok: false, error: `Scale maximum must be between ${RATING_MAX_MIN} and ${RATING_MAX_MAX}.` };
  }
  if (!isValidRatingValue(value, max)) {
    return { ok: false, error: `Rating must be between 0 and ${max}.` };
  }
  return { ok: true };
}

/** normalized_rating = clamp((value / max) * 100, 0, 100) */
export function normalizeRating(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  const raw = (value / max) * 100;
  return Math.round(Math.min(100, Math.max(0, raw)) * 100) / 100;
}

export function buildNormalizedRating(value: number, max: number): NormalizedRating {
  return {
    ratingValue: value,
    ratingMax: max,
    normalizedRating: normalizeRating(value, max),
  };
}

/** Legacy 1–10 overall → keep rating column in sync during transition. */
export function legacyTenPointFromNormalized(normalized: number): number {
  const v = Math.min(10, Math.max(1, normalized / 10));
  return Math.round(v * 10) / 10;
}

/** Display helper: 0–100 normalized → 0–10 (one decimal). */
export function tenPointFromNormalized(normalized: number): number {
  if (!Number.isFinite(normalized)) return 0;
  const v = Math.min(100, Math.max(0, normalized)) / 10;
  return Math.round(v * 10) / 10;
}

export function formatTenPointScore(normalized: number): string {
  const v = tenPointFromNormalized(normalized);
  const display = Number.isInteger(v) || Math.abs(v - Math.round(v)) < 0.05 ? String(v) : v.toFixed(1);
  return `${display}/10`;
}

export function formatUserRating(value: number, max: number): string {
  const display =
    Number.isInteger(value) || Math.abs(value - Math.round(value)) < 0.05
      ? String(Math.round(value * 10) / 10)
      : value.toFixed(1);
  return `${display} / ${max}`;
}

/** `score` is 0–100 normalized; shown as /10 for UI consistency. */
export function formatPickyBitesScore(score: number): string {
  return `PickyBites Score: ${formatTenPointScore(score)}`;
}
