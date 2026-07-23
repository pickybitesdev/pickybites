import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { FeedEmptyState } from "@/components/feed/FeedEmptyState";
import { FeedRestaurantRecCard } from "@/components/feed/FeedRestaurantRecCard";
import { FeedFriendReviewCard } from "@/components/feed/FeedFriendReviewCard";
import { FeedEndState } from "@/components/feed/FeedEndState";
import { FeedFilterChips } from "@/components/feed/FeedFilterChips";
import { FeedCustomizeSheet } from "@/components/feed/FeedCustomizeSheet";
import { DEFAULT_FEED_PREFERENCES } from "@/lib/feed-preferences";
import type { FeedFriendReviewItem, FeedRestaurantRecItem } from "@/lib/feed/types";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("@/lib/useThemedColors", () => ({
  useThemedColors: () => ({
    brand: "#FF8559",
    iconMuted: "#9D9692",
    spinner: "#FF8559",
    placeholder: "#9D9692",
  }),
}));

function renderWithSafeArea(ui: React.ReactElement) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      {ui}
    </SafeAreaProvider>,
  );
}

const restaurant = {
  id: "r1",
  name: "Coral Kitchen",
  address: "1 Main",
  city: "Houston",
  cuisine: "Italian" as const,
  priceLevel: 2 as const,
  imageUrl: null,
  latitude: 29.76,
  longitude: -95.37,
  createdAt: "2024-01-01",
};

function friendItem(overrides: Partial<FeedFriendReviewItem> = {}): FeedFriendReviewItem {
  return {
    id: "review:1",
    type: "friend_review",
    review: {
      id: "1",
      userId: "friend",
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
      text: "Sangria + gambas — the patio at golden hour is the whole point of going out.",
      visitDate: "2024-06-01",
      tags: ["Date Night"],
      createdAt: "2024-06-01T12:00:00Z",
    },
    author: {
      id: "friend",
      email: "f@t.com",
      username: "jordan",
      displayName: "Jordan Kim",
      avatarUrl: null,
      city: "Miami",
      bio: "",
      favoriteCuisines: [],
      hasCompletedTasteQuiz: true,
      createdAt: "2024-01-01",
    },
    restaurant,
    isOwn: false,
    likeCount: 4,
    commentCount: 2,
    imageUrl: null,
    ...overrides,
  };
}

describe("feed UI components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders friends-only header with customize control", () => {
    const onCustomize = jest.fn();
    const onScopeChange = jest.fn();
    renderWithSafeArea(
      <FeedHeader scope="friends" onScopeChange={onScopeChange} onCustomize={onCustomize} />,
    );
    expect(screen.getByText("Feed")).toBeTruthy();
    expect(screen.getByText(/people you follow/)).toBeTruthy();
    expect(screen.queryByLabelText("For You")).toBeNull();
    expect(screen.queryByTestId("feed-scope-toggle")).toBeNull();
    fireEvent.press(screen.getByLabelText("Customize Feed"));
    expect(onCustomize).toHaveBeenCalled();
  });

  it("shows active filter badge on customize button", () => {
    renderWithSafeArea(
      <FeedHeader
        scope="friends"
        onScopeChange={jest.fn()}
        onCustomize={jest.fn()}
        activeFilterCount={2}
      />,
    );
    expect(screen.getByTestId("feed-customize-badge")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByLabelText(/2 filters active/)).toBeTruthy();
  });

  it("empty state offers discover for friends feed", () => {
    const onFindFriends = jest.fn();
    const onDiscover = jest.fn();
    renderWithSafeArea(
      <FeedEmptyState
        kind="friends"
        onFindFriends={onFindFriends}
        onDiscover={onDiscover}
        onResetFeed={jest.fn()}
        onAdjustPreferences={jest.fn()}
        onRetry={jest.fn()}
      />,
    );
    expect(screen.getByText("No friend activity yet")).toBeTruthy();
    fireEvent.press(screen.getByText("Open Discover"));
    expect(onDiscover).toHaveBeenCalled();
  });

  it("filtered empty offers reset and adjust", () => {
    const onReset = jest.fn();
    const onAdjust = jest.fn();
    renderWithSafeArea(
      <FeedEmptyState
        kind="filtered"
        onFindFriends={jest.fn()}
        onDiscover={jest.fn()}
        onResetFeed={onReset}
        onAdjustPreferences={onAdjust}
        onRetry={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText("Reset Feed"));
    fireEvent.press(screen.getByText("Adjust Preferences"));
    expect(onReset).toHaveBeenCalled();
    expect(onAdjust).toHaveBeenCalled();
  });

  it("restaurant rec card opens why and save", () => {
    const item: FeedRestaurantRecItem = {
      id: "rec:r1",
      type: "restaurant_rec",
      restaurant,
      matchPercent: 84,
      reason: "Matches your love for Italian food",
      distanceMeters: 800,
      communityRating: 8.5,
    };
    const onSave = jest.fn();
    const onWhy = jest.fn();
    renderWithSafeArea(
      <FeedRestaurantRecCard
        item={item}
        onSave={onSave}
        onHideRestaurant={jest.fn()}
        onFewerLikeThis={jest.fn()}
        onWhy={onWhy}
      />,
    );
    expect(screen.getByText("Coral Kitchen")).toBeTruthy();
    expect(screen.getByText(/84% match/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Save to Try Next"));
    expect(onSave).toHaveBeenCalled();
  });

  it("friend review navigates photo to bite", () => {
    const item = friendItem();
    renderWithSafeArea(
      <FeedFriendReviewCard
        item={item}
        isBookmarked={false}
        onSave={jest.fn()}
        onHidePost={jest.fn()}
        onFewerFromPerson={jest.fn()}
        onUnfollow={jest.fn()}
      />,
    );
    expect(screen.queryByLabelText(/likes/)).toBeNull();
    expect(screen.queryByLabelText(/comments/)).toBeNull();
    fireEvent.press(screen.getByTestId("feed-friend-photo"));
    expect(router.push).toHaveBeenCalledWith("/bite/1");
  });

  it("friend review opens restaurant from name and review from caption", () => {
    const item = friendItem();
    renderWithSafeArea(
      <FeedFriendReviewCard
        item={item}
        isBookmarked={false}
        onSave={jest.fn()}
        onHidePost={jest.fn()}
        onFewerFromPerson={jest.fn()}
        onUnfollow={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByTestId("feed-friend-restaurant"));
    expect(router.push).toHaveBeenCalledWith("/restaurant/r1");
    fireEvent.press(screen.getByTestId("feed-friend-caption"));
    expect(router.push).toHaveBeenCalledWith("/bite/1");
  });

  it("shows best match hint when enabled", () => {
    renderWithSafeArea(
      <FeedFriendReviewCard
        item={friendItem()}
        isBookmarked={false}
        onSave={jest.fn()}
        onHidePost={jest.fn()}
        onFewerFromPerson={jest.fn()}
        onUnfollow={jest.fn()}
        showBestMatchHint
      />,
    );
    expect(screen.getByText(/Strong taste match/)).toBeTruthy();
  });

  it("friend review shows Your review label for own posts and overflow only", () => {
    const item = friendItem({
      isOwn: true,
      author: {
        id: "me",
        email: "me@t.com",
        username: "me",
        displayName: "Me",
        avatarUrl: null,
        city: "Houston",
        bio: "",
        favoriteCuisines: [],
        hasCompletedTasteQuiz: true,
        createdAt: "2024-01-01",
      },
      review: {
        ...friendItem().review,
        userId: "me",
      },
    });
    renderWithSafeArea(
      <FeedFriendReviewCard
        item={item}
        isBookmarked={false}
        onSave={jest.fn()}
        onHidePost={jest.fn()}
        onFewerFromPerson={jest.fn()}
        onUnfollow={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText("Your review")).toBeTruthy();
    expect(screen.queryByLabelText("Delete")).toBeNull();
    fireEvent.press(screen.getByLabelText("Post options"));
    expect(screen.getByLabelText("Edit")).toBeTruthy();
    expect(screen.getByLabelText("Delete")).toBeTruthy();
  });

  it("renders filter chips with clear", () => {
    const onClear = jest.fn();
    renderWithSafeArea(
      <FeedFilterChips
        prefs={{
          ...DEFAULT_FEED_PREFERENCES,
          sort: "best_match",
          cuisineOverrides: ["Italian"],
          distance: "5mi",
        }}
        onClear={onClear}
      />,
    );
    expect(screen.getByTestId("feed-filter-chips")).toBeTruthy();
    expect(screen.getByText("Best match")).toBeTruthy();
    expect(screen.getByText("Italian")).toBeTruthy();
    fireEvent.press(screen.getByTestId("feed-clear-filters"));
    expect(onClear).toHaveBeenCalled();
  });

  it("customize reset only updates draft until apply", () => {
    const onApply = jest.fn();
    renderWithSafeArea(
      <FeedCustomizeSheet
        visible
        prefs={{
          ...DEFAULT_FEED_PREFERENCES,
          sort: "best_match",
          cuisineOverrides: ["Thai"],
        }}
        onClose={jest.fn()}
        onApply={onApply}
      />,
    );
    fireEvent.press(screen.getByTestId("feed-customize-reset"));
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("feed-customize-apply"));
    expect(onApply).toHaveBeenCalledWith(DEFAULT_FEED_PREFERENCES);
  });

  it("shows distance location hint when GPS unavailable", () => {
    renderWithSafeArea(
      <FeedCustomizeSheet
        visible
        prefs={DEFAULT_FEED_PREFERENCES}
        locationAvailable={false}
        onClose={jest.fn()}
        onApply={jest.fn()}
      />,
    );
    expect(screen.getByTestId("feed-distance-location-hint")).toBeTruthy();
  });

  it("renders end of feed state", () => {
    renderWithSafeArea(<FeedEndState />);
    expect(screen.getByTestId("feed-end-state")).toBeTruthy();
  });
});
