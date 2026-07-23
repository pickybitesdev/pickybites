import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { BitesWantToTrySection } from "@/components/bites/BitesWantToTrySection";
import type { Bookmark } from "@/lib/types";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

function makeBookmark(overrides: Partial<Bookmark>): Bookmark {
  return {
    id: "b1",
    userId: "user-1",
    restaurantId: "r1",
    googlePlaceId: "g1",
    placeName: "Taco Spot",
    placeAddress: "1 Main St",
    placeCity: "Los Angeles",
    placeCuisine: "Mexican",
    placePriceLevel: 2,
    placeImageUrl: null,
    latitude: 34.05,
    longitude: -118.24,
    status: "want_to_try",
    reasonSaved: "Heard great things",
    plannedAt: null,
    visitedAt: null,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
    ...overrides,
  };
}

describe("BitesWantToTrySection visited home", () => {
  const active = makeBookmark({ id: "active", placeName: "Active Spot" });
  const visited = makeBookmark({
    id: "visited",
    placeName: "Visited Spot",
    status: "visited",
    visitedAt: "2024-07-01T00:00:00Z",
  });

  it("renders visited subsection with Add a Bite and Try Next actions", () => {
    const onLeaveReview = jest.fn();
    const onMoveToWantToTry = jest.fn();

    render(
      <BitesWantToTrySection
        items={[active]}
        visitedItems={[visited]}
        isEmpty={false}
        isFilterEmpty={false}
        hasSearch={false}
        coords={null}
        onOpen={jest.fn()}
        onMarkPlanned={jest.fn()}
        onMarkVisited={jest.fn()}
        onLeaveReview={onLeaveReview}
        onMoveToWantToTry={onMoveToWantToTry}
        onRemove={jest.fn()}
      />,
    );

    expect(screen.getByTestId("bites-visited-section")).toBeTruthy();
    expect(screen.getByText("Visited — not yet reviewed")).toBeTruthy();
    expect(screen.getByText("Visited Spot")).toBeTruthy();

    fireEvent.press(screen.getByTestId("bookmark-add-bite"));
    expect(onLeaveReview).toHaveBeenCalledWith(visited);

    fireEvent.press(screen.getByTestId("bookmark-move-try-next"));
    expect(onMoveToWantToTry).toHaveBeenCalledWith(visited);
  });

  it("shows visited empty hint when there are no visited items", () => {
    render(
      <BitesWantToTrySection
        items={[active]}
        visitedItems={[]}
        isEmpty={false}
        isFilterEmpty={false}
        hasSearch={false}
        coords={null}
        onOpen={jest.fn()}
        onMarkPlanned={jest.fn()}
        onMarkVisited={jest.fn()}
        onLeaveReview={jest.fn()}
        onMoveToWantToTry={jest.fn()}
        onRemove={jest.fn()}
      />,
    );

    expect(screen.getByTestId("bites-visited-empty")).toBeTruthy();
  });
});
