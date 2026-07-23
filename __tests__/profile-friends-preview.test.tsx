import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import {
  PROFILE_FRIENDS_PREVIEW_LIMIT,
  ProfileFriendsPreview,
} from "@/components/profile/ProfileFriendsPreview";
import type { Follow, Restaurant, Review, User } from "@/lib/types";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("@/store/useThemeStore", () => ({
  useThemeStore: (selector: (s: { resolved: string }) => unknown) =>
    selector({ resolved: "light" }),
}));

jest.mock("@/lib/useThemedColors", () => ({
  useThemedColors: () => ({
    brand: "#FF8559",
    iconMuted: "#9D9692",
    spinner: "#FF8559",
    placeholder: "#9D9692",
  }),
}));

const me: User = {
  id: "user-me",
  email: "me@test.com",
  username: "me",
  displayName: "Me",
  avatarUrl: null,
  city: "LA",
  bio: null,
  favoriteCuisines: [],
  hasCompletedTasteQuiz: false,
  createdAt: "2024-01-01T00:00:00Z",
};

function makeUser(id: string, name: string): User {
  return { ...me, id, username: id, displayName: name };
}

function makeFollow(followerId: string, followingId: string): Follow {
  return {
    id: `f-${followerId}-${followingId}`,
    followerId,
    followingId,
    createdAt: "2024-01-01T00:00:00Z",
  };
}

function mockStore(overrides: {
  users?: User[];
  follows?: Follow[];
  reviews?: Review[];
  restaurants?: Restaurant[];
}) {
  const users = overrides.users ?? [me];
  const follows = overrides.follows ?? [];
  const reviews = overrides.reviews ?? [];
  const restaurants = overrides.restaurants ?? [];

  jest.spyOn(require("@/store/useAppStore"), "useAppStore").mockImplementation(
    (selector?: (s: Record<string, unknown>) => unknown) => {
      const state = {
        users,
        currentUserId: me.id,
        reviews,
        restaurants,
        follows,
      };
      return selector ? selector(state) : state;
    },
  );
}

describe("ProfileFriendsPreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exports a preview limit of 5", () => {
    expect(PROFILE_FRIENDS_PREVIEW_LIMIT).toBe(5);
  });

  it("shows at most 5 friends sorted by taste match", () => {
    const friends = Array.from({ length: 7 }, (_, i) => makeUser(`user-${i + 1}`, `Friend ${i + 1}`));
    mockStore({
      users: [me, ...friends],
      follows: friends.map((u) => makeFollow(me.id, u.id)),
    });

    render(<ProfileFriendsPreview />);

    expect(screen.getByTestId("profile-friends-preview")).toBeTruthy();
    expect(screen.getAllByText(/Friend \d+/)).toHaveLength(5);
    expect(screen.queryByText("Friend 6")).toBeNull();
    expect(screen.queryByText("Friend 7")).toBeNull();
  });

  it("opens Friends when See all is pressed", () => {
    const friends = Array.from({ length: 6 }, (_, i) => makeUser(`user-${i + 1}`, `Friend ${i + 1}`));
    mockStore({
      users: [me, ...friends],
      follows: friends.map((u) => makeFollow(me.id, u.id)),
    });

    render(<ProfileFriendsPreview />);

    fireEvent.press(screen.getByTestId("profile-friends-see-all"));
    expect(router.push).toHaveBeenCalledWith("/friends");
  });

  it("shows the bottom See all friends button when following more than 5", () => {
    const friends = Array.from({ length: 6 }, (_, i) => makeUser(`user-${i + 1}`, `Friend ${i + 1}`));
    mockStore({
      users: [me, ...friends],
      follows: friends.map((u) => makeFollow(me.id, u.id)),
    });

    render(<ProfileFriendsPreview />);

    expect(screen.getByTestId("profile-friends-see-all-button")).toBeTruthy();
    fireEvent.press(screen.getByTestId("profile-friends-see-all-button"));
    expect(router.push).toHaveBeenCalledWith("/friends");
  });

  it("does not show the bottom See all friends button when following 5 or fewer", () => {
    const friends = Array.from({ length: 5 }, (_, i) => makeUser(`user-${i + 1}`, `Friend ${i + 1}`));
    mockStore({
      users: [me, ...friends],
      follows: friends.map((u) => makeFollow(me.id, u.id)),
    });

    render(<ProfileFriendsPreview />);

    expect(screen.getByTestId("profile-friends-see-all")).toBeTruthy();
    expect(screen.queryByTestId("profile-friends-see-all-button")).toBeNull();
  });
});
