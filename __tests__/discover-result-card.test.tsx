import React from "react";
import { StyleSheet } from "react-native";
import { render, fireEvent, screen } from "@testing-library/react-native";
import {
  DiscoverResultCard,
  buildPrimaryMetaParts,
  buildSecondaryMetaParts,
  buildCardAccessibilityLabel,
} from "@/components/discover/DiscoverResultCard";
import { DISCOVER_RESULT_CARD_HEIGHT, DISCOVER_RESULT_IMAGE_HEIGHT } from "@/lib/discover-tray";
import { brandColors } from "@/constants/branding";

jest.mock("@/lib/useThemedColors", () => ({
  useThemedColors: () => ({
    brand: "#FF8559",
    iconMuted: "#9D9692",
    spinner: "#FF8559",
    placeholder: "#9D9692",
  }),
}));

jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children, ...props }: { children?: React.ReactNode }) => (
      <View testID="discover-result-image-gradient" {...props}>
        {children}
      </View>
    ),
  };
});

describe("buildPrimaryMetaParts", () => {
  it("joins cuisine, distance, and price when available", () => {
    expect(
      buildPrimaryMetaParts({ cuisine: "Mexican", distance: "0.8 mi", price: "$$" }),
    ).toEqual(["Mexican", "0.8 mi", "$$"]);
  });

  it("skips missing fields without empties", () => {
    expect(buildPrimaryMetaParts({ cuisine: "Thai", distance: null, price: null })).toEqual([
      "Thai",
    ]);
    expect(buildPrimaryMetaParts({ cuisine: null, distance: "1.2 mi", price: "$$$" })).toEqual([
      "1.2 mi",
      "$$$",
    ]);
    expect(buildPrimaryMetaParts({})).toEqual([]);
  });
});

describe("buildSecondaryMetaParts", () => {
  it("includes rating and open status when available", () => {
    expect(buildSecondaryMetaParts({ rating: 4.6, openNow: true }).map((p) => p.text)).toEqual([
      "★ 4.6",
      "Open now",
    ]);
  });

  it("skips missing fields", () => {
    expect(buildSecondaryMetaParts({ rating: 4.2, openNow: null })).toEqual([
      { kind: "rating", text: "★ 4.2" },
    ]);
    expect(buildSecondaryMetaParts({ rating: null, openNow: false })).toEqual([
      { kind: "open", text: "Closed" },
    ]);
    expect(buildSecondaryMetaParts({})).toEqual([]);
  });
});

describe("buildCardAccessibilityLabel", () => {
  it("announces open details and selected state", () => {
    expect(
      buildCardAccessibilityLabel({ name: "Chipotle", openNow: true, selected: true }),
    ).toBe("Chipotle, Open now, selected. Opens restaurant details");
  });
});

describe("DiscoverResultCard vertical layout", () => {
  it("opens details on card press and exposes Directions, Share, Save", () => {
    const onOpen = jest.fn();
    const onBookmark = jest.fn();
    const onShare = jest.fn();
    const onDirections = jest.fn();
    render(
      <DiscoverResultCard
        width={300}
        name="Coral Kitchen"
        cuisine="Italian"
        distanceMeters={800}
        rating={4.5}
        priceLevel={2}
        priceLevelKnown
        matchPercent={84}
        openNow
        selected
        onOpen={onOpen}
        onBookmark={onBookmark}
        onShare={onShare}
        onDirections={onDirections}
      />,
    );

    expect(screen.queryByText("View Details")).toBeNull();
    expect(screen.queryByText("84% match")).toBeNull();
    expect(screen.getByText("Coral Kitchen")).toBeTruthy();
    expect(screen.getByText("Open now")).toBeTruthy();
    expect(screen.getByTestId("discover-result-primary-meta").props.children).toContain("Italian");
    expect(screen.getByTestId("discover-result-primary-meta").props.children).toContain("$$");
    expect(screen.getByText("★ 4.5")).toBeTruthy();
    expect(screen.getByTestId("discover-result-secondary-meta")).toBeTruthy();

    fireEvent.press(
      screen.getByLabelText("Coral Kitchen, Open now, selected. Opens restaurant details"),
    );
    expect(onOpen).toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Save to Try Next"));
    expect(onBookmark).toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Share Coral Kitchen"));
    expect(onShare).toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Get directions to Coral Kitchen"));
    expect(onDirections).toHaveBeenCalled();
  });

  it("exposes Add to List when provided", () => {
    const onAddToList = jest.fn();
    render(
      <DiscoverResultCard
        width={300}
        name="List Spot"
        onOpen={jest.fn()}
        onBookmark={jest.fn()}
        onShare={jest.fn()}
        onDirections={jest.fn()}
        onAddToList={onAddToList}
      />,
    );
    fireEvent.press(screen.getByTestId("discover-result-add-to-list"));
    expect(onAddToList).toHaveBeenCalled();
  });

  it("puts price on the primary line, not the secondary decision line", () => {
    render(
      <DiscoverResultCard
        width={300}
        name="Priced Spot"
        cuisine="Mexican"
        distanceMeters={400}
        priceLevel={3}
        priceLevelKnown
        rating={4.1}
        onOpen={jest.fn()}
      />,
    );
    const primary = String(screen.getByTestId("discover-result-primary-meta").props.children);
    expect(primary).toContain("Mexican");
    expect(primary).toContain("$$$");
    const secondary = screen.getByTestId("discover-result-secondary-meta");
    expect(String(secondary.props.children)).not.toContain("$$$");
    expect(screen.getByText("★ 4.1")).toBeTruthy();
  });

  it("renders Closed with warning color when openNow is false", () => {
    render(
      <DiscoverResultCard
        width={300}
        name="Closed Spot"
        openNow={false}
        onOpen={jest.fn()}
      />,
    );
    const status = screen.getByTestId("discover-result-open-status");
    expect(status.props.children).toBe("Closed");
    const flat = StyleSheet.flatten(status.props.style);
    expect(flat.color).toBe(brandColors.warning);
  });

  it("renders Open now with success color", () => {
    render(
      <DiscoverResultCard width={300} name="Open Spot" openNow onOpen={jest.fn()} />,
    );
    const status = screen.getByTestId("discover-result-open-status");
    expect(status.props.children).toBe("Open now");
    const flat = StyleSheet.flatten(status.props.style);
    expect(flat.color).toBe(brandColors.success);
  });

  it("omits meta rows when no data", () => {
    render(<DiscoverResultCard width={300} name="Sparse Spot" onOpen={jest.fn()} />);
    expect(screen.queryByTestId("discover-result-primary-meta")).toBeNull();
    expect(screen.queryByTestId("discover-result-secondary-meta")).toBeNull();
  });

  it("shows Saved state when bookmarked", () => {
    render(
      <DiscoverResultCard
        width={300}
        name="Saved Spot"
        isBookmarked
        onOpen={jest.fn()}
        onBookmark={jest.fn()}
      />,
    );
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.getByLabelText("Remove from Try Next")).toBeTruthy();
  });

  it("fires Try Next without opening the restaurant card", () => {
    const onOpen = jest.fn();
    const onBookmark = jest.fn();
    render(
      <DiscoverResultCard
        width={300}
        name="Tap Spot"
        onOpen={onOpen}
        onBookmark={onBookmark}
        onShare={jest.fn()}
        onDirections={jest.fn()}
      />,
    );

    expect(screen.getByText("Try Next")).toBeTruthy();
    fireEvent.press(screen.getByTestId("discover-result-save"));
    expect(onBookmark).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("truncates long restaurant names to two lines", () => {
    render(
      <DiscoverResultCard
        width={300}
        name="A Very Long Restaurant Name That Should Ellipsize Nicely On The Card"
        onOpen={jest.fn()}
      />,
    );
    const title = screen.getByText(
      "A Very Long Restaurant Name That Should Ellipsize Nicely On The Card",
    );
    expect(title.props.numberOfLines).toBe(2);
  });

  it("renders image fallback when no imageUrl", () => {
    render(<DiscoverResultCard width={300} name="No Photo" onOpen={jest.fn()} />);
    expect(screen.getByTestId("discover-result-card-image-fallback")).toBeTruthy();
  });

  it("renders image loading state when imageUrl is provided", () => {
    render(
      <DiscoverResultCard
        width={300}
        name="Photo Spot"
        imageUrl="https://example.com/food.jpg"
        onOpen={jest.fn()}
      />,
    );
    expect(screen.getByTestId("discover-result-card-image-loading")).toBeTruthy();
  });

  it("renders as a compact vertical floating card", () => {
    render(<DiscoverResultCard width={300} name="Solo Spot" onOpen={jest.fn()} />);
    const card = screen.getByTestId("discover-result-card");
    const flat = StyleSheet.flatten(card.props.style);
    expect(flat.height).toBe(DISCOVER_RESULT_CARD_HEIGHT);
    expect(flat.height).toBeLessThanOrEqual(310);
    expect(DISCOVER_RESULT_IMAGE_HEIGHT).toBeGreaterThanOrEqual(145);
    expect(flat.backgroundColor).toBe(brandColors.surface);
    expect(flat.flexDirection).not.toBe("row");
  });

  it("uses subtle selected styling with white surface", () => {
    render(
      <DiscoverResultCard width={300} name="Selected Spot" selected onOpen={jest.fn()} />,
    );
    const card = screen.getByTestId("discover-result-card");
    const flat = StyleSheet.flatten(card.props.style);
    expect(flat.borderColor).toBe(brandColors.primarySoft);
    expect(flat.borderWidth).toBe(1);
    expect(flat.backgroundColor).toBe(brandColors.surface);
    expect(flat.shadowOpacity).toBe(0.12);
    expect(flat.elevation).toBe(8);
  });

  it("uses neutral border when unselected", () => {
    render(<DiscoverResultCard width={300} name="Plain Spot" onOpen={jest.fn()} />);
    const card = screen.getByTestId("discover-result-card");
    const flat = StyleSheet.flatten(card.props.style);
    expect(flat.borderColor).toBe(brandColors.border);
    expect(flat.backgroundColor).toBe(brandColors.surface);
  });

  it("does not render match percentage even when provided", () => {
    render(
      <DiscoverResultCard
        width={300}
        name="Quiet Spot"
        matchPercent={58}
        onOpen={jest.fn()}
      />,
    );
    expect(screen.queryByText(/^\d+%\s*match$/i)).toBeNull();
    expect(screen.queryByText("58% match")).toBeNull();
  });

  it("does not show Yelp review counts on the compact card", () => {
    render(
      <DiscoverResultCard
        width={300}
        name="Rated Spot"
        yelpRating={4.2}
        yelpReviewCount={128}
        rating={4.5}
        onOpen={jest.fn()}
      />,
    );
    expect(screen.queryByText(/Yelp\s/i)).toBeNull();
    expect(screen.queryByText(/\(128\)/)).toBeNull();
    expect(screen.getByText("★ 4.5")).toBeTruthy();
  });
});
