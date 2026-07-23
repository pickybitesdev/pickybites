import { Platform } from "react-native";
import {
  CENTER_PLUS_ICON_SIZE,
  CENTER_PLUS_OFFSET,
  CENTER_PLUS_SHADOW,
  CENTER_PLUS_SIZE,
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_CORNER_RADIUS,
  TAB_BAR_HORIZONTAL_MARGIN,
  TAB_SCROLL_BOTTOM_PADDING,
  getFloatingTabClearance,
  getMaxPlusOverhang,
  getTabBarHeight,
  scrollPaddingClearsTabBar,
} from "@/lib/tab-bar";

describe("bottom navigation safe areas", () => {
  it("includes bottom inset in floating tab bar height", () => {
    // content 72 + max(inset, 8)
    expect(getTabBarHeight(34)).toBe(106);
    expect(getTabBarHeight(0)).toBe(80);
    expect(Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web").toBe(true);
  });

  it("uses floating capsule geometry", () => {
    expect(TAB_BAR_HORIZONTAL_MARGIN).toBeGreaterThanOrEqual(14);
    expect(TAB_BAR_HORIZONTAL_MARGIN).toBeLessThanOrEqual(20);
    expect(TAB_BAR_CONTENT_HEIGHT).toBeGreaterThanOrEqual(68);
    expect(TAB_BAR_CONTENT_HEIGHT).toBeLessThanOrEqual(76);
    expect(TAB_BAR_CORNER_RADIUS).toBeGreaterThanOrEqual(24);
    expect(TAB_BAR_CORNER_RADIUS).toBeLessThanOrEqual(30);
  });

  it("nudges the center plus slightly so it stays integrated", () => {
    expect(CENTER_PLUS_OFFSET).toBeGreaterThan(0);
    expect(CENTER_PLUS_OFFSET).toBeLessThanOrEqual(8);
  });

  it("sizes the center plus for the floating capsule", () => {
    expect(CENTER_PLUS_SIZE).toBeGreaterThanOrEqual(48);
    expect(CENTER_PLUS_SIZE).toBeLessThanOrEqual(52);
  });

  it("sizes the plus icon to match the button", () => {
    expect(CENTER_PLUS_ICON_SIZE).toBeGreaterThanOrEqual(20);
    expect(CENTER_PLUS_ICON_SIZE).toBeLessThanOrEqual(24);
  });

  it("uses a soft shadow instead of a heavy floating card", () => {
    expect(CENTER_PLUS_SHADOW.shadowOpacity).toBeLessThanOrEqual(0.15);
    expect(CENTER_PLUS_SHADOW.elevation).toBeLessThanOrEqual(4);
  });

  it("keeps scroll padding clear of the floating tab bar", () => {
    expect(getMaxPlusOverhang()).toBe(0);
    expect(scrollPaddingClearsTabBar(0)).toBe(true);
    expect(scrollPaddingClearsTabBar(34)).toBe(true);
    expect(TAB_SCROLL_BOTTOM_PADDING).toBeGreaterThanOrEqual(getFloatingTabClearance(34));
  });

  it("keeps plus diameter even for clean centering", () => {
    expect(CENTER_PLUS_SIZE % 2).toBe(0);
  });

  it("uses five equal flex slots for geometric center alignment", () => {
    const { VISIBLE_TAB_ORDER } = require("@/lib/tabs");
    expect(VISIBLE_TAB_ORDER).toHaveLength(5);
    expect(VISIBLE_TAB_ORDER[2]).toBe("add");
  });

  it("aligns active tab color with coral primary", () => {
    const { brandColors } = require("@/constants/branding");
    expect(brandColors.primary).toBe("#FF8559");
    expect(brandColors.iconInactive).toBe("#9D9692");
  });
});
