import React, { useState } from "react";
import { Text, Pressable, View } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderRouter, screen } from "expo-router/testing-library";
import {
  DEFAULT_DISCOVER_VIEW_MODE,
  countActiveDiscoverFilters,
  toggleDiscoverViewMode,
  type DiscoverViewMode,
} from "@/lib/discover-view";
import { expandResultsLabel, trayBottomOffset } from "@/lib/discover-tray";
import { TAB_SCROLL_BOTTOM_PADDING } from "@/lib/tab-bar";

function DiscoverShell() {
  const [mode, setMode] = useState<DiscoverViewMode>(DEFAULT_DISCOVER_VIEW_MODE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [trayExpanded, setTrayExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const resultCount = 2;
  const filterCount = countActiveDiscoverFilters({
    cuisine: "Italian",
    radiusMeters: 800,
    curatedTab: "trending",
  });

  return (
    <View testID="discover-screen">
      <Text>Picky</Text>
      <Text>Bites</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Surprise Me">
        <Text>Surprise Me</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={filterCount > 0 ? `Filters (${filterCount})` : "Filters"}
        onPress={() => setFiltersOpen(true)}
      >
        <Text>{filterCount > 0 ? `Filters (${filterCount})` : "Filters"}</Text>
      </Pressable>
      {filtersOpen ? (
        <View testID="filters-sheet">
          <Text>Filters</Text>
          <Pressable accessibilityLabel="Close filters" onPress={() => setFiltersOpen(false)}>
            <Text>Close</Text>
          </Pressable>
        </View>
      ) : null}

      {mode === "map" ? (
        <View testID="results-tray" style={{ bottom: trayBottomOffset() }}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: true }}
            onPress={() => setMode("map")}
          >
            <Text>Map</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: false }}
            onPress={() => setMode("list")}
          >
            <Text>List</Text>
          </Pressable>

          <Pressable
            testID="map-marker"
            accessibilityLabel="Select restaurant pin"
            onPress={() => setTrayExpanded(true)}
          >
            <Text>Marker</Text>
          </Pressable>

          {!trayExpanded ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={expandResultsLabel(resultCount)}
              onPress={() => setTrayExpanded(true)}
            >
              <Text>{expandResultsLabel(resultCount)}</Text>
            </Pressable>
          ) : (
            <View testID="restaurant-preview">
              <Text>Coral Kitchen</Text>
              <Pressable
                accessibilityLabel="View details"
                onPress={() => {
                  const { router } = require("expo-router");
                  router.push("/restaurant/r1");
                }}
              >
                <Text>View details</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={bookmarked ? "Remove from Try Next" : "Save to Try Next"}
                onPress={() => setBookmarked((v) => !v)}
              >
                <Text>{bookmarked ? "Bookmarked" : "Bookmark"}</Text>
              </Pressable>
              <Pressable accessibilityLabel="Collapse results" onPress={() => setTrayExpanded(false)}>
                <Text>Close preview</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <View>
          <Text>List results</Text>
          <Pressable onPress={() => setMode("map")}>
            <Text>Map</Text>
          </Pressable>
          <Pressable onPress={() => setMode("list")}>
            <Text>List</Text>
          </Pressable>
        </View>
      )}

      <Text testID="mode-label">{mode}</Text>
      <Text testID="toggled-once">{toggleDiscoverViewMode(mode)}</Text>
      <Text testID="tab-clearance">{TAB_SCROLL_BOTTOM_PADDING}</Text>
    </View>
  );
}

describe("discover navigation integration", () => {
  it("defaults to map and exposes Map/List labels", () => {
    renderRouter(
      {
        "(tabs)/discover": () => <DiscoverShell />,
      },
      { initialUrl: "/(tabs)/discover" },
    );

    expect(screen.getByTestId("mode-label").props.children).toBe("map");
    expect(screen.getByText("Map")).toBeTruthy();
    expect(screen.getByText("List")).toBeTruthy();
    expect(screen.getByText("Surprise Me")).toBeTruthy();
    expect(screen.getByLabelText("Expand 2 Results")).toBeTruthy();
  });

  it("opens Filters sheet from Filters button", () => {
    renderRouter(
      {
        "(tabs)/discover": () => <DiscoverShell />,
      },
      { initialUrl: "/(tabs)/discover" },
    );

    fireEvent.press(screen.getByLabelText("Filters (3)"));
    expect(screen.getByTestId("filters-sheet")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Close filters"));
    expect(screen.queryByTestId("filters-sheet")).toBeNull();
  });

  it("shows tray card on marker select and opens restaurant details", () => {
    const result = renderRouter(
      {
        "(tabs)/discover": () => <DiscoverShell />,
        "restaurant/[id]": () => (
          <View>
            <Text>Restaurant Detail</Text>
          </View>
        ),
      },
      { initialUrl: "/(tabs)/discover" },
    );

    fireEvent.press(screen.getByTestId("map-marker"));
    expect(screen.getByTestId("restaurant-preview")).toBeTruthy();
    expect(screen.getByText("Coral Kitchen")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Save to Try Next"));
    expect(screen.getByText("Bookmarked")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("View details"));
    expect(result.getPathname()).toBe("/restaurant/r1");
    expect(screen.getByText("Restaurant Detail")).toBeTruthy();
  });

  it("switches to list mode while keeping chrome", () => {
    renderRouter(
      {
        "(tabs)/discover": () => <DiscoverShell />,
      },
      { initialUrl: "/(tabs)/discover" },
    );

    fireEvent.press(screen.getByText("List"));
    expect(screen.getByTestId("mode-label").props.children).toBe("list");
    expect(screen.getByText("List results")).toBeTruthy();
    expect(screen.getByText("Surprise Me")).toBeTruthy();
    expect(screen.queryByTestId("results-tray")).toBeNull();
  });
});
