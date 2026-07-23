import {
  DISCOVER_EXPAND_PILL_HEIGHT,
  DISCOVER_EXPAND_PILL_MAX_WIDTH,
  DISCOVER_EXPANDED_CHROME_HEIGHT,
  DISCOVER_RESULT_CARD_HEIGHT,
  DISCOVER_TRAY_HORIZONTAL_MARGIN,
  DISCOVER_TRAY_MAX_HEIGHT,
  DISCOVER_TRAY_MIN_HEIGHT,
  DISCOVER_TRAY_EXPANDED_FRACTION,
  EMPTY_TRAY_MESSAGE,
  capTrayResults,
  expandResultsLabel,
  expandedTrayHeight,
  nearbyHeaderLabel,
  reconcileSelection,
  trayBottomOffset,
  trayClearsTabBar,
} from "@/lib/discover-tray";
import { TAB_SCROLL_BOTTOM_PADDING, getFloatingTabClearance } from "@/lib/tab-bar";
import { DISCOVER_RESULT_LIMIT } from "@/lib/discover-results";

describe("discover-tray labels", () => {
  it("formats expand labels for 0, 1, and N", () => {
    expect(expandResultsLabel(0)).toBe("No Results Nearby");
    expect(expandResultsLabel(1)).toBe("Expand 1 Result");
    expect(expandResultsLabel(15)).toBe("Expand 15 Results");
  });

  it("formats nearby header labels", () => {
    expect(nearbyHeaderLabel(0)).toBe("No restaurants nearby");
    expect(nearbyHeaderLabel(1)).toBe("1 restaurant nearby");
    expect(nearbyHeaderLabel(15)).toBe("15 restaurants nearby");
  });

  it("exports empty tray copy", () => {
    expect(EMPTY_TRAY_MESSAGE).toContain("filters");
  });
});

describe("discover-tray selection", () => {
  it("keeps selection when still in results", () => {
    expect(reconcileSelection("b", ["a", "b", "c"])).toBe("b");
  });

  it("selects first when current is removed", () => {
    expect(reconcileSelection("gone", ["a", "b"])).toBe("a");
  });

  it("clears when results are empty", () => {
    expect(reconcileSelection("a", [])).toBeNull();
  });
});

describe("discover-tray layout", () => {
  it("caps results to Discover limit of 15", () => {
    const items = Array.from({ length: 40 }, (_, i) => i);
    expect(capTrayResults(items)).toHaveLength(DISCOVER_RESULT_LIMIT);
  });

  it("expanded height fits chrome + vertical floating card band", () => {
    const windowHeight = 800;
    const h = expandedTrayHeight(windowHeight);
    expect(h).toBeGreaterThanOrEqual(DISCOVER_TRAY_MIN_HEIGHT);
    expect(h).toBeLessThanOrEqual(DISCOVER_TRAY_MAX_HEIGHT);
    expect(h).toBeGreaterThanOrEqual(
      DISCOVER_EXPANDED_CHROME_HEIGHT + DISCOVER_RESULT_CARD_HEIGHT,
    );
    expect(DISCOVER_TRAY_EXPANDED_FRACTION).toBeGreaterThanOrEqual(0.45);
    expect(DISCOVER_RESULT_CARD_HEIGHT).toBeGreaterThanOrEqual(300);
    expect(DISCOVER_RESULT_CARD_HEIGHT).toBeLessThanOrEqual(320);
    expect(DISCOVER_EXPANDED_CHROME_HEIGHT).toBeLessThanOrEqual(64);
    expect(DISCOVER_TRAY_MIN_HEIGHT).toBeLessThanOrEqual(390);
    expect(DISCOVER_TRAY_MAX_HEIGHT).toBeLessThanOrEqual(440);
  });

  it("collapsed pill geometry matches floating system", () => {
    expect(DISCOVER_EXPAND_PILL_HEIGHT).toBeGreaterThanOrEqual(52);
    expect(DISCOVER_EXPAND_PILL_HEIGHT).toBeLessThanOrEqual(58);
    expect(DISCOVER_EXPAND_PILL_MAX_WIDTH).toBe(340);
    expect(DISCOVER_TRAY_HORIZONTAL_MARGIN).toBeGreaterThanOrEqual(12);
    expect(DISCOVER_TRAY_HORIZONTAL_MARGIN).toBeLessThanOrEqual(18);
  });

  it("tray bottom clears floating tab bar", () => {
    const bottom = trayBottomOffset(34);
    expect(bottom).toBe(getFloatingTabClearance(34));
    expect(trayClearsTabBar(bottom, 34)).toBe(true);
  });

  it("collapse always docks pill using live tab clearance", () => {
    const inset = 34;
    const bottom = trayBottomOffset(inset);
    expect(bottom).toBe(getFloatingTabClearance(inset));
    expect(bottom).toBeLessThanOrEqual(TAB_SCROLL_BOTTOM_PADDING);
  });
});
