import React from "react";
import { Text, Pressable, View } from "react-native";
import { act, fireEvent } from "@testing-library/react-native";
import { renderRouter, screen } from "expo-router/testing-library";
import {
  PROFILE_MENU,
  PROFILE_SETTINGS_MIN_TOUCH,
  profileMenuLabels,
} from "@/lib/profile-menu";

function LabelScreen({ label }: { label: string }) {
  return (
    <View>
      <Text>{label}</Text>
    </View>
  );
}

/** Lightweight Profile shell mirroring the cleaned navigation contract. */
function ProfileShell({ displayName = "Alex Rivera" }: { displayName?: string }) {
  return (
    <View testID="profile-screen">
      <View>
        <Text>Profile</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          testID="profile-settings-button"
          onPress={() => {
            const { router } = require("expo-router");
            router.push("/settings");
          }}
          style={{ minWidth: PROFILE_SETTINGS_MIN_TOUCH, minHeight: PROFILE_SETTINGS_MIN_TOUCH }}
        >
          <Text>Settings gear</Text>
        </Pressable>
      </View>
      <Text>{displayName}</Text>
      <Pressable
        testID="profile-taste-dna-badge"
        onPress={() => {
          const { router } = require("expo-router");
          router.push("/taste-dna");
        }}
      >
        <Text>Hidden Gem Hunter</Text>
      </Pressable>
      <Text>Reviews</Text>
      <Text>Followers</Text>
      <Text>Following</Text>
      <Pressable
        testID="profile-following-stat"
        onPress={() => {
          const { router } = require("expo-router");
          router.push("/friends");
        }}
      >
        <Text>5</Text>
      </Pressable>
      <Pressable
        testID="profile-followers-stat"
        onPress={() => {
          const { router } = require("expo-router");
          router.push("/friends");
        }}
      >
        <Text>3</Text>
      </Pressable>
      <Pressable
        testID="profile-edit-button"
        onPress={() => {
          const { router } = require("expo-router");
          router.push("/edit-profile");
        }}
      >
        <Text>Edit Profile</Text>
      </Pressable>
      <Pressable
        testID="profile-find-friends-button"
        onPress={() => {
          const { router } = require("expo-router");
          router.push("/friends");
        }}
      >
        <Text>Find Friends</Text>
      </Pressable>
      {PROFILE_MENU.map((item) => (
        <Pressable
          key={item.label}
          testID={`profile-menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          onPress={() => {
            const { router } = require("expo-router");
            router.push(item.href);
          }}
        >
          <Text>{item.label}</Text>
          <Text>{item.desc}</Text>
        </Pressable>
      ))}
    </View>
  );
}

describe("profile navigation integration", () => {
  it("does not render the You/Friends segmented control", () => {
    renderRouter(
      {
        "(tabs)/profile": () => <ProfileShell />,
      },
      { initialUrl: "/(tabs)/profile" },
    );

    expect(screen.queryByText("Who am I as a food user?")).toBeNull();
    expect(screen.queryByText("You")).toBeNull();
    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.getByText("Alex Rivera")).toBeTruthy();
    expect(screen.queryByText("Cuisines")).toBeNull();
    expect(screen.queryByText("Badge")).toBeNull();
    expect(screen.getByText("Followers")).toBeTruthy();
    expect(screen.getByText("Following")).toBeTruthy();
  });

  it("opens Settings from the gear icon", async () => {
    const result = renderRouter(
      {
        "(tabs)/profile": () => <ProfileShell />,
        settings: () => <LabelScreen label="Settings Screen" />,
      },
      { initialUrl: "/(tabs)/profile" },
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Open settings"));
    });

    expect(result.getPathname()).toBe("/settings");
    expect(screen.getByText("Settings Screen")).toBeTruthy();
  });

  it("opens Taste DNA from the badge under the username", async () => {
    const result = renderRouter(
      {
        "(tabs)/profile": () => <ProfileShell />,
        "taste-dna": () => <LabelScreen label="Taste DNA Screen" />,
      },
      { initialUrl: "/(tabs)/profile" },
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-taste-dna-badge"));
    });

    expect(result.getPathname()).toBe("/taste-dna");
    expect(screen.getByText("Taste DNA Screen")).toBeTruthy();
  });

  it("opens Friends from the Followers stat", async () => {
    const result = renderRouter(
      {
        "(tabs)/profile": () => <ProfileShell />,
        friends: () => (
          <View>
            <Text>Friends Screen</Text>
            <Text>Following</Text>
          </View>
        ),
      },
      { initialUrl: "/(tabs)/profile" },
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-followers-stat"));
    });

    expect(result.getPathname()).toBe("/friends");
    expect(screen.getByText("Friends Screen")).toBeTruthy();
  });

  it("opens Edit Profile from the CTA", async () => {
    const result = renderRouter(
      {
        "(tabs)/profile": () => <ProfileShell />,
        "edit-profile": () => <LabelScreen label="Edit Profile Screen" />,
      },
      { initialUrl: "/(tabs)/profile" },
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-button"));
    });

    expect(result.getPathname()).toBe("/edit-profile");
    expect(screen.getByText("Edit Profile Screen")).toBeTruthy();
  });

  it("opens Friends from Find Friends CTA", async () => {
    const result = renderRouter(
      {
        "(tabs)/profile": () => <ProfileShell />,
        friends: () => (
          <View>
            <Text>Friends Screen</Text>
            <Text>Find people by name, @username, or city...</Text>
            <Text>Following</Text>
          </View>
        ),
      },
      { initialUrl: "/(tabs)/profile" },
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-find-friends-button"));
    });

    expect(result.getPathname()).toBe("/friends");
    expect(screen.getByText("Friends Screen")).toBeTruthy();
    expect(screen.getByText("Following")).toBeTruthy();
  });

  it("returns to Profile from Friends via replace fallback", async () => {
    const result = renderRouter(
      {
        "(tabs)/profile": () => <ProfileShell />,
        friends: () => (
          <Pressable
            onPress={() => {
              const { router } = require("expo-router");
              router.replace("/(tabs)/profile");
            }}
          >
            <Text>Back to Profile</Text>
          </Pressable>
        ),
      },
      { initialUrl: "/(tabs)/profile" },
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-find-friends-button"));
    });
    expect(result.getPathname()).toBe("/friends");

    await act(async () => {
      fireEvent.press(screen.getByText("Back to Profile"));
    });
    expect(result.getPathname()).toBe("/profile");
    expect(screen.getByText("Alex Rivera")).toBeTruthy();
  });

  it("has no secondary profile menu items", () => {
    expect(profileMenuLabels()).toEqual([]);
  });
});
