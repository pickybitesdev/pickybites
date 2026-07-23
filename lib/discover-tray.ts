import { TAB_SCROLL_BOTTOM_PADDING, getFloatingTabClearance } from "@/lib/tab-bar";
import { DISCOVER_RESULT_LIMIT } from "@/lib/discover-results";

/** Collapsed Expand Results pill height. */
export const DISCOVER_EXPAND_PILL_HEIGHT = 54;

/** Collapsed pill corner radius. */
export const DISCOVER_EXPAND_PILL_RADIUS = 26;

/** Max width for collapsed Expand pill. */
export const DISCOVER_EXPAND_PILL_MAX_WIDTH = 340;

/** Side inset for carousel peek only (panel itself is full-bleed). */
export const DISCOVER_TRAY_HORIZONTAL_MARGIN = 12;

/** Corner radius for floating results panel + cards. */
export const DISCOVER_TRAY_CORNER_RADIUS = 24;

/** Vertical food-first restaurant card height (image + details + actions). */
export const DISCOVER_RESULT_CARD_HEIGHT = 310;

/** Minimum hero image band — image flex-grows to fill leftover card height. */
export const DISCOVER_RESULT_IMAGE_HEIGHT = 155;

/** Chrome above cards: handle + single header row (count + Map/List + collapse). */
export const DISCOVER_EXPANDED_CHROME_HEIGHT = 58;

/** Absolute min/max expanded panel height (chrome + one card). */
export const DISCOVER_TRAY_MIN_HEIGHT = 380;
export const DISCOVER_TRAY_MAX_HEIGHT = 430;

/** @deprecated use DISCOVER_EXPAND_PILL_HEIGHT */
export const DISCOVER_TRAY_COLLAPSED_HEIGHT = DISCOVER_EXPAND_PILL_HEIGHT;

/** Fraction of usable map column used when expanded. */
export const DISCOVER_TRAY_EXPANDED_FRACTION = 0.52;

/** Debounce for map camera follow when carousel selection changes. */
export const DISCOVER_CAMERA_DEBOUNCE_MS = 300;

export function expandResultsLabel(count: number): string {
  if (count <= 0) return "No Results Nearby";
  if (count === 1) return "Expand 1 Result";
  return `Expand ${count} Results`;
}

export function nearbyHeaderLabel(count: number): string {
  if (count <= 0) return "No restaurants nearby";
  if (count === 1) return "1 restaurant nearby";
  return `${count} restaurants nearby`;
}

export const EMPTY_TRAY_MESSAGE = "No restaurants match this area and your filters.";

/**
 * Keep selection if still present; otherwise first result; otherwise null.
 */
export function reconcileSelection(
  selectedId: string | null,
  ids: string[],
): string | null {
  if (selectedId && ids.includes(selectedId)) return selectedId;
  return ids[0] ?? null;
}

/** Cap tray/carousel items to Discover's hard limit. */
export function capTrayResults<T>(items: T[]): T[] {
  return items.slice(0, DISCOVER_RESULT_LIMIT);
}

/**
 * Expanded panel height: chrome + vertical card, clamped for floating panel.
 */
export function expandedTrayHeight(
  windowHeight: number,
  headerApprox = 160,
  fraction = DISCOVER_TRAY_EXPANDED_FRACTION,
  bottomClearance = TAB_SCROLL_BOTTOM_PADDING,
): number {
  const content =
    DISCOVER_EXPANDED_CHROME_HEIGHT + DISCOVER_RESULT_CARD_HEIGHT + 16;
  const usable = Math.max(0, windowHeight - headerApprox - bottomClearance);
  const height = Math.round(usable * fraction);
  const bandMin = Math.round(usable * 0.48);
  const bandMax = Math.round(usable * 0.62);
  const withinBand = Math.min(bandMax, Math.max(bandMin, height));
  const preferred = Math.max(content, withinBand);
  return Math.min(DISCOVER_TRAY_MAX_HEIGHT, Math.max(DISCOVER_TRAY_MIN_HEIGHT, preferred));
}

/** Live bottom offset — sits just above the floating tab (no oversized fixed pad). */
export function trayBottomOffset(bottomInset = 34): number {
  return getFloatingTabClearance(bottomInset);
}

export function trayClearsTabBar(bottom?: number, bottomInset = 34): boolean {
  const b = bottom ?? trayBottomOffset(bottomInset);
  return b >= getFloatingTabClearance(bottomInset);
}

/** Soft floating surface shadow shared with tab capsule / cards. */
export const DISCOVER_FLOATING_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 14,
  elevation: 8,
} as const;
