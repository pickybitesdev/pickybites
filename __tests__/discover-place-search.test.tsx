import React from "react";
import { render, fireEvent, screen, waitFor, act } from "@testing-library/react-native";
import { DiscoverPlaceSearch } from "@/components/discover/DiscoverPlaceSearch";
import {
  autocompletePlaces,
  resolvePlaceDetails,
  searchPlacesByText,
  isGooglePlacesConfigured,
} from "@/lib/places/google";

jest.mock("@/lib/useThemedColors", () => ({
  useThemedColors: () => ({
    brand: "#FF8559",
    iconMuted: "#9D9692",
    spinner: "#FF8559",
    placeholder: "#9D9692",
  }),
}));

jest.mock("@/lib/places/google", () => ({
  autocompletePlaces: jest.fn(),
  resolvePlaceDetails: jest.fn(),
  searchPlacesByText: jest.fn(),
  isGooglePlacesConfigured: jest.fn(() => true),
}));

jest.mock("@/lib/haptics", () => ({
  hapticSelection: jest.fn(),
}));

const mockAutocomplete = autocompletePlaces as jest.Mock;
const mockResolve = resolvePlaceDetails as jest.Mock;
const mockSearchText = searchPlacesByText as jest.Mock;
const mockConfigured = isGooglePlacesConfigured as jest.Mock;

describe("DiscoverPlaceSearch", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockConfigured.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not call autocomplete until min chars and debounce elapse", async () => {
    mockAutocomplete.mockResolvedValue([]);
    render(
      <DiscoverPlaceSearch coords={null} onResolvedPlace={jest.fn()} />,
    );
    fireEvent.changeText(
      screen.getByLabelText("Search city, neighborhood, or restaurant"),
      "a",
    );
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(mockAutocomplete).not.toHaveBeenCalled();

    fireEvent.changeText(
      screen.getByLabelText("Search city, neighborhood, or restaurant"),
      "austin",
    );
    expect(mockAutocomplete).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(mockAutocomplete).toHaveBeenCalledTimes(1));
    expect(mockAutocomplete).toHaveBeenCalledWith(
      "austin",
      expect.objectContaining({ sessionToken: expect.any(String) }),
    );
  });

  it("selecting a suggestion resolves place details without auto-selecting while typing", async () => {
    const onResolvedPlace = jest.fn();
    mockAutocomplete.mockResolvedValue([
      {
        id: "p1",
        placeId: "p1",
        primaryText: "Austin",
        secondaryText: "Texas",
        kinds: ["locality"],
        kind: "area",
      },
    ]);
    mockResolve.mockResolvedValue({
      placeId: "p1",
      name: "Austin",
      address: "Austin, TX",
      city: "Austin",
      latitude: 30.27,
      longitude: -97.74,
      cuisineTypes: ["locality"],
      primaryType: "locality",
      imageUrl: null,
      kind: "area",
      viewport: null,
    });

    render(
      <DiscoverPlaceSearch coords={null} onResolvedPlace={onResolvedPlace} />,
    );
    fireEvent.changeText(
      screen.getByLabelText("Search city, neighborhood, or restaurant"),
      "aust",
    );
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => screen.getByText("Austin"));
    expect(onResolvedPlace).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText("Austin"));
    await waitFor(() => expect(screen.queryByTestId("discover-search-suggestions")).toBeNull());
    await waitFor(() => expect(mockResolve).toHaveBeenCalledWith("p1", expect.any(String)));
    await waitFor(() =>
      expect(onResolvedPlace).toHaveBeenCalledWith(
        expect.objectContaining({ placeId: "p1", name: "Austin", kind: "area" }),
      ),
    );
  });

  it("hides the dropdown immediately when a suggestion is tapped", async () => {
    mockAutocomplete.mockResolvedValue([
      {
        id: "nyc",
        placeId: "nyc",
        primaryText: "New York",
        secondaryText: "NY, USA",
        kinds: ["locality"],
        kind: "area",
      },
    ]);
    mockResolve.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                placeId: "nyc",
                name: "New York",
                address: "New York, NY, USA",
                city: "New York",
                latitude: 40.71,
                longitude: -74.01,
                cuisineTypes: ["locality"],
                primaryType: "locality",
                imageUrl: null,
                kind: "area",
                viewport: null,
              }),
            500,
          ),
        ),
    );

    render(<DiscoverPlaceSearch coords={null} onResolvedPlace={jest.fn()} />);
    fireEvent.changeText(
      screen.getByLabelText("Search city, neighborhood, or restaurant"),
      "new york",
    );
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => screen.getByText("New York"));

    fireEvent.press(screen.getByText("New York"));
    expect(screen.queryByTestId("discover-search-suggestions")).toBeNull();
  });

  it("submits exact search via keyboard Search", async () => {
    const onResolvedPlace = jest.fn();
    mockSearchText.mockResolvedValue([
      {
        placeId: "r1",
        name: "Coral Kitchen",
        address: "Houston",
        city: "Houston",
        latitude: 29.7,
        longitude: -95.4,
        cuisineTypes: ["restaurant"],
        primaryType: "restaurant",
        imageUrl: null,
        kind: "restaurant",
        viewport: null,
      },
    ]);

    render(
      <DiscoverPlaceSearch coords={null} onResolvedPlace={onResolvedPlace} />,
    );
    const input = screen.getByLabelText("Search city, neighborhood, or restaurant");
    fireEvent.changeText(input, "Coral Kitchen");
    fireEvent(input, "submitEditing");
    await waitFor(() => expect(mockSearchText).toHaveBeenCalledWith("Coral Kitchen", undefined));
    // Out-of-area / city jumps should not force local bias on submit.
    await waitFor(() =>
      expect(onResolvedPlace).toHaveBeenCalledWith(
        expect.objectContaining({ placeId: "r1", kind: "restaurant" }),
      ),
    );
  });

  it("shows no-results message when autocomplete returns empty", async () => {
    mockAutocomplete.mockResolvedValue([]);
    render(
      <DiscoverPlaceSearch coords={null} onResolvedPlace={jest.fn()} />,
    );
    fireEvent.changeText(
      screen.getByLabelText("Search city, neighborhood, or restaurant"),
      "zzzzzz",
    );
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(screen.getByText("No matching places found.")).toBeTruthy());
  });
});
