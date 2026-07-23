/** Shared tab bar geometry — floating capsule + safe-area clearance. */

/** Horizontal inset so the capsule floats inset from screen edges. */
export const TAB_BAR_HORIZONTAL_MARGIN = 16;

/** Gap between home indicator / bottom edge and capsule exterior. */
export const TAB_BAR_BOTTOM_MARGIN = 8;

/** Capsule content row height (icons + labels), excluding safe-area padding. */
export const TAB_BAR_CONTENT_HEIGHT = 72;

/** Capsule corner radius. */
export const TAB_BAR_CORNER_RADIUS = 28;

/**
 * Vertical nudge for the center plus within its equal-width slot.
 * Positive moves it down slightly so it stays integrated with the capsule.
 */
export const CENTER_PLUS_OFFSET = 6;

/** Circular center plus diameter — integrated with capsule, not detached. */
export const CENTER_PLUS_SIZE = 50;

/** Plus glyph size inside the center button. */
export const CENTER_PLUS_ICON_SIZE = 24;

/** Soft shadow for the center plus — restrained. */
export const CENTER_PLUS_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.12,
  shadowRadius: 3,
  elevation: 3,
} as const;

/** Capsule exterior shadow. */
export const TAB_BAR_CAPSULE_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 8,
} as const;

/**
 * Total height from screen bottom to the top of the floating capsule.
 * Matches PickyTabBar: content height + bottom safe padding (no double-counted margin).
 */
export function getTabBarHeight(bottomInset: number) {
  const safePad = Math.max(bottomInset, TAB_BAR_BOTTOM_MARGIN);
  return TAB_BAR_CONTENT_HEIGHT + safePad;
}

/**
 * Clearance so floating trays/scroll sit just above the capsule.
 * Tiny sibling gap — large enough not to collide, small enough to kill the map strip.
 */
export function getFloatingTabClearance(bottomInset: number) {
  return getTabBarHeight(bottomInset) + 4;
}

/**
 * Fixed padding used by scroll screens (Feed, Bites, list mode).
 * Sized for typical iPhone home indicator (34).
 * getFloatingTabClearance(34) = 72+34+4 = 110
 */
export const TAB_SCROLL_BOTTOM_PADDING = 110;

/** How far the plus can stick above the bar top (none when offset is downward). */
export function getMaxPlusOverhang() {
  return Math.max(0, -CENTER_PLUS_OFFSET);
}

/** True when scroll padding clears the floating tab bar and plus overhang. */
export function scrollPaddingClearsTabBar(bottomInset: number) {
  const required = getFloatingTabClearance(bottomInset) + getMaxPlusOverhang();
  return TAB_SCROLL_BOTTOM_PADDING >= required;
}
