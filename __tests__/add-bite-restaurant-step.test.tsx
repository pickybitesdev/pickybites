import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RestaurantPickStep } from "@/components/add-bite/RestaurantPickStep";
import type { PlaceResult } from "@/lib/places/types";
import type { Restaurant } from "@/lib/types";

jest.mock("@/lib/places/google", () => ({
  isGooglePlacesConfigured: () => true,
  getPlacesSearchStatus: () => "ready",
  isPlacesSearchReady: () => true,
  searchNearbyRestaurants: jest.fn(async () => [
    {
      googlePlaceId: "near-1",
      name: "Nearby Tacos",
      address: "1 Main",
      city: "Houston",
      cuisine: "Mexican",
      priceLevel: 1,
      imageUrl: null,
      latitude: 29.76,
      longitude: -95.37,
    },
  ]),
  searchRestaurantsByText: jest.fn(async (q: string) => {
    if (q.toLowerCase().includes("zzz")) return [];
    return [
      {
        googlePlaceId: "search-1",
        name: "Island Grill",
        address: "2 Main",
        city: "Houston",
        cuisine: "Mediterranean",
        priceLevel: 2,
        imageUrl: null,
        latitude: 29.76,
        longitude: -95.37,
      },
    ];
  }),
}));

const coords = { latitude: 29.76, longitude: -95.37 };

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderPick(overrides: Partial<React.ComponentProps<typeof RestaurantPickStep>> = {}) {
  const onSelectPlace = jest.fn();
  const onSelectLocal = jest.fn();
  const onContinue = jest.fn();
  const onSaveWithoutReview = jest.fn();
  const props: React.ComponentProps<typeof RestaurantPickStep> = {
    coords,
    currentUserId: "me",
    restaurants: [],
    reviews: [],
    bookmarks: [],
    selectedRestaurantId: null,
    selectedPlaceId: null,
    selectedName: "",
    onSelectPlace,
    onSelectLocal,
    onContinue,
    onSaveWithoutReview,
    ...overrides,
  };
  render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <RestaurantPickStep {...props} />
    </SafeAreaProvider>,
  );
  return { onSelectPlace, onSelectLocal, onContinue, onSaveWithoutReview };
}

describe("RestaurantPickStep", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("defaults to Nearby and loads nearby restaurants", async () => {
    renderPick();
    expect(screen.getByTestId("add-bite-source-nearby")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("Nearby Tacos")).toBeTruthy();
    });
  });

  it("switches to Recent tab", async () => {
    const restaurants: Restaurant[] = [
      {
        id: "r1",
        name: "Recent Spot",
        address: "",
        city: "Houston",
        cuisine: "Italian",
        priceLevel: 2,
        imageUrl: null,
        createdAt: "2024-01-01",
      },
    ];
    renderPick({
      restaurants,
      reviews: [
        {
          id: "rev1",
          userId: "me",
          restaurantId: "r1",
          rating: 8,
          ratingValue: 8,
          ratingMax: 10,
          normalizedRating: 80,
          visibility: "friends",
          categoryScores: { foodQuality: 8, service: 8, atmosphere: 8, value: 8 },
          ratingManualOverride: false,
          waitTime: null,
          wouldReturn: true,
          wouldRecommend: true,
          text: "",
          visitDate: "2024-01-01",
          tags: [],
          createdAt: "2024-06-01T00:00:00Z",
        },
      ],
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("add-bite-source-recent"));
    });
    expect(screen.getByText("Recent Spot")).toBeTruthy();
  });

  it("keeps Continue disabled without selection and enables with selection", async () => {
    const { onContinue } = renderPick({ selectedName: "" });
    const continueBtn = screen.getByTestId("add-bite-continue");
    expect(continueBtn.props.accessibilityState?.disabled ?? continueBtn.props.disabled).toBeTruthy();
    fireEvent.press(continueBtn);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("enables Continue when a restaurant is selected", () => {
    const { onContinue } = renderPick({
      selectedName: "Island Grill",
      selectedPlaceId: "search-1",
    });
    fireEvent.press(screen.getByTestId("add-bite-continue"));
    expect(onContinue).toHaveBeenCalled();
  });

  it("selecting a nearby row calls onSelectPlace", async () => {
    const { onSelectPlace } = renderPick();
    await waitFor(() => screen.getByText("Nearby Tacos"));
    fireEvent.press(screen.getByText("Nearby Tacos"));
    expect(onSelectPlace).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Nearby Tacos", googlePlaceId: "near-1" }),
    );
  });

  it("shows no-results and add-missing after empty search", async () => {
    renderPick();
    fireEvent.changeText(screen.getByTestId("add-bite-restaurant-search"), "zzz nowhere");
    await waitFor(() => {
      expect(screen.getByText("No restaurants found.")).toBeTruthy();
      expect(screen.getByTestId("add-bite-add-missing")).toBeTruthy();
    });
  });

  it("add missing restaurant submits a manual place", async () => {
    const { onSelectPlace } = renderPick();
    fireEvent.changeText(screen.getByTestId("add-bite-restaurant-search"), "zzz nowhere");
    await waitFor(() => screen.getByTestId("add-bite-add-missing"));
    fireEvent.press(screen.getByTestId("add-bite-add-missing"));
    fireEvent.changeText(screen.getByTestId("add-bite-missing-name"), "Brand New Spot");
    fireEvent.press(screen.getByTestId("add-bite-missing-submit"));
    expect(onSelectPlace).toHaveBeenCalledWith(
      expect.objectContaining<Partial<PlaceResult>>({ name: "Brand New Spot" }),
    );
  });

  it("marks selected row with selected accessibility state", async () => {
    renderPick({
      selectedName: "Nearby Tacos",
      selectedPlaceId: "near-1",
    });
    await waitFor(() => screen.getByText("Nearby Tacos"));
    const row = screen.getByLabelText(/Nearby Tacos, selected/);
    expect(row).toBeTruthy();
  });
});
