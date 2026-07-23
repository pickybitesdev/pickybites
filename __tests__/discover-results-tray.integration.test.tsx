import React, { useState, useMemo } from "react";
import { Text, Pressable, View } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderRouter, screen } from "expo-router/testing-library";
import {
  expandResultsLabel,
  nearbyHeaderLabel,
  reconcileSelection,
  EMPTY_TRAY_MESSAGE,
  trayBottomOffset,
} from "@/lib/discover-tray";
import { TAB_SCROLL_BOTTOM_PADDING } from "@/lib/tab-bar";
import type { DiscoverViewMode } from "@/lib/discover-view";

type Place = { id: string; name: string };

function DiscoverTrayShell({
  initialPlaces = [
    { id: "p1", name: "Coral Kitchen" },
    { id: "p2", name: "Savory Spot" },
  ] as Place[],
}: {
  initialPlaces?: Place[];
}) {
  const [mode, setMode] = useState<DiscoverViewMode>("map");
  const [expanded, setExpanded] = useState(false);
  const [places, setPlaces] = useState(initialPlaces);
  const [selectedId, setSelectedId] = useState<string | null>(places[0]?.id ?? null);
  const [bookmarked, setBookmarked] = useState(false);

  const ids = useMemo(() => places.map((p) => p.id), [places]);
  const count = places.length;
  const expandLabel = expandResultsLabel(count);
  const headerLabel = nearbyHeaderLabel(count);

  const applyResults = (next: Place[]) => {
    setPlaces(next);
    setSelectedId((prev) => reconcileSelection(prev, next.map((p) => p.id)));
  };

  if (mode === "list") {
    return (
      <View testID="discover-list">
        <Text>List results</Text>
        <Pressable accessibilityRole="button" onPress={() => setMode("map")}>
          <Text>Map</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View testID="discover-map">
      <Pressable
        testID="map-marker-p2"
        accessibilityLabel="Select restaurant pin"
        onPress={() => {
          setSelectedId("p2");
          setExpanded(true);
        }}
      >
        <Text>Marker p2</Text>
      </Pressable>

      <View testID="results-tray" style={{ bottom: trayBottomOffset() }}>
        <Pressable accessibilityRole="button" onPress={() => setMode("list")}>
          <Text>List</Text>
        </Pressable>
        <Text>Map</Text>

        {!expanded ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expandLabel}
            testID="expand-tray"
            onPress={() => setExpanded(true)}
          >
            <Text>{expandLabel}</Text>
          </Pressable>
        ) : (
          <View testID="expanded-tray">
            <View testID="discover-results-panel">
              <Text accessibilityLiveRegion="polite">{headerLabel}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Collapse results"
                onPress={() => setExpanded(false)}
              >
                <Text>Collapse</Text>
              </Pressable>

              {count === 0 ? (
                <View>
                  <Text>{EMPTY_TRAY_MESSAGE}</Text>
                  <Pressable accessibilityLabel="Clear Filters" onPress={() => applyResults(initialPlaces)}>
                    <Text>Clear Filters</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Search a Wider Area"
                    onPress={() => applyResults([{ id: "wide", name: "Wider Spot" }])}
                  >
                    <Text>Search a Wider Area</Text>
                  </Pressable>
                </View>
              ) : (
                places.map((p) => (
                  <Pressable
                    key={p.id}
                    testID={`card-${p.id}`}
                    accessibilityState={{ selected: selectedId === p.id }}
                    onPress={() => setSelectedId(p.id)}
                  >
                    <Text>{p.name}</Text>
                    {selectedId === p.id ? <Text testID="selected-card">{p.name}</Text> : null}
                    <Pressable
                      accessibilityLabel="View Details"
                      onPress={() => {
                        const { router } = require("expo-router");
                        router.push(`/restaurant/${p.id}`);
                      }}
                    >
                      <Text>View Details</Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={bookmarked ? "Remove from Try Next" : "Save to Try Next"}
                      onPress={() => setBookmarked((v) => !v)}
                    >
                      <Text>{bookmarked ? "Bookmarked" : "Bookmark"}</Text>
                    </Pressable>
                    <Pressable accessibilityLabel={`Get directions to ${p.name}`}>
                      <Text>Directions</Text>
                    </Pressable>
                    <Pressable accessibilityLabel={`Share ${p.name}`}>
                      <Text>Share</Text>
                    </Pressable>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        )}
      </View>

      <Pressable
        testID="search-this-area"
        onPress={() => applyResults([{ id: "new1", name: "Area Cafe" }])}
      >
        <Text>Search this area</Text>
      </Pressable>

      <Pressable testID="apply-filters" onPress={() => applyResults([])}>
        <Text>Apply empty filters</Text>
      </Pressable>

      <Text testID="selected-id">{selectedId ?? "none"}</Text>
      <Text testID="result-ids">{ids.join(",")}</Text>
    </View>
  );
}

describe("discover results tray integration", () => {
  it("renders collapsed expand label with dynamic count", () => {
    renderRouter(
      { "(tabs)/discover": () => <DiscoverTrayShell /> },
      { initialUrl: "/(tabs)/discover" },
    );
    expect(screen.getByLabelText("Expand 2 Results")).toBeTruthy();
    expect(screen.queryByTestId("expanded-tray")).toBeNull();
    expect(screen.queryByText("Rated")).toBeNull();
    expect(screen.queryByText(/spots/i)).toBeNull();
  });


  it("expands on tap and collapses again", () => {
    renderRouter(
      { "(tabs)/discover": () => <DiscoverTrayShell /> },
      { initialUrl: "/(tabs)/discover" },
    );
    fireEvent.press(screen.getByTestId("expand-tray"));
    expect(screen.getByTestId("expanded-tray")).toBeTruthy();
    expect(screen.getByTestId("discover-results-panel")).toBeTruthy();
    expect(screen.getByText("2 restaurants nearby")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Collapse results"));
    expect(screen.queryByTestId("expanded-tray")).toBeNull();
    expect(screen.getByLabelText("Expand 2 Results")).toBeTruthy();
  });

  it("marker tap expands and selects matching card", () => {
    renderRouter(
      { "(tabs)/discover": () => <DiscoverTrayShell /> },
      { initialUrl: "/(tabs)/discover" },
    );
    fireEvent.press(screen.getByTestId("map-marker-p2"));
    expect(screen.getByTestId("expanded-tray")).toBeTruthy();
    expect(screen.getByTestId("selected-id").props.children).toBe("p2");
    expect(screen.getByTestId("selected-card").props.children).toBe("Savory Spot");
  });

  it("card swipe/select updates selected marker id", () => {
    renderRouter(
      { "(tabs)/discover": () => <DiscoverTrayShell /> },
      { initialUrl: "/(tabs)/discover" },
    );
    fireEvent.press(screen.getByTestId("expand-tray"));
    fireEvent.press(screen.getByTestId("card-p2"));
    expect(screen.getByTestId("selected-id").props.children).toBe("p2");
  });

  it("search this area reconciles selection to new results", () => {
    renderRouter(
      { "(tabs)/discover": () => <DiscoverTrayShell /> },
      { initialUrl: "/(tabs)/discover" },
    );
    fireEvent.press(screen.getByTestId("search-this-area"));
    expect(screen.getByTestId("selected-id").props.children).toBe("new1");
    expect(screen.getByTestId("result-ids").props.children).toBe("new1");
  });

  it("filter clearing empty results shows empty state actions", () => {
    renderRouter(
      { "(tabs)/discover": () => <DiscoverTrayShell /> },
      { initialUrl: "/(tabs)/discover" },
    );
    fireEvent.press(screen.getByTestId("apply-filters"));
    fireEvent.press(screen.getByLabelText("No Results Nearby"));
    expect(screen.getByText(EMPTY_TRAY_MESSAGE)).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Clear Filters"));
    expect(screen.getByText("2 restaurants nearby")).toBeTruthy();
    expect(screen.getByTestId("result-ids").props.children).toBe("p1,p2");
  });

  it("hides tray in list mode", () => {
    renderRouter(
      { "(tabs)/discover": () => <DiscoverTrayShell /> },
      { initialUrl: "/(tabs)/discover" },
    );
    fireEvent.press(screen.getByText("List"));
    expect(screen.getByTestId("discover-list")).toBeTruthy();
    expect(screen.queryByTestId("results-tray")).toBeNull();
  });

  it("opens details and bookmarks from card", () => {
    const result = renderRouter(
      {
        "(tabs)/discover": () => <DiscoverTrayShell />,
        "restaurant/[id]": () => (
          <View>
            <Text>Restaurant Detail</Text>
          </View>
        ),
      },
      { initialUrl: "/(tabs)/discover" },
    );
    fireEvent.press(screen.getByTestId("expand-tray"));
    fireEvent.press(screen.getAllByLabelText("Save to Try Next")[0]);
    expect(screen.getAllByText("Bookmarked").length).toBeGreaterThan(0);
    fireEvent.press(screen.getAllByLabelText("View Details")[0]);
    expect(result.getPathname()).toBe("/restaurant/p1");
  });

  it("tray bottom clears tab bar padding", () => {
    expect(trayBottomOffset(34)).toBeLessThanOrEqual(TAB_SCROLL_BOTTOM_PADDING);
  });

  it("singular expand label for one result", () => {
    renderRouter(
      {
        "(tabs)/discover": () => (
          <DiscoverTrayShell initialPlaces={[{ id: "only", name: "Solo Spot" }]} />
        ),
      },
      { initialUrl: "/(tabs)/discover" },
    );
    expect(screen.getByLabelText("Expand 1 Result")).toBeTruthy();
  });
});
