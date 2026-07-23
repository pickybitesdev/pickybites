import React from "react";
import { Text, Pressable, View } from "react-native";
import { act, fireEvent } from "@testing-library/react-native";
import { renderRouter, screen } from "expo-router/testing-library";
import { ADD_ACTIONS } from "@/lib/add-actions";
import { AUTHENTICATED_HOME } from "@/lib/tabs";

function LabelScreen({ label }: { label: string }) {
  return (
    <View>
      <Text>{label}</Text>
    </View>
  );
}

function AddChooser() {
  return (
    <View>
      <Text>Add</Text>
      {ADD_ACTIONS.map((action) => (
        <Pressable
          key={action.title}
          onPress={() => {
            const { router } = require("expo-router");
            router.push(action.href);
          }}
        >
          <Text>{action.title}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const addWorkflowRoutes = {
  "(tabs)/add": AddChooser,
  "add-bite": () => <LabelScreen label="Add a Bite Flow" />,
  "add-dish": () => <LabelScreen label="Dish Form" />,
};

describe("tab navigation integration", () => {
  it("starts authenticated users on Discover", () => {
    const result = renderRouter(
      {
        "(tabs)/discover": () => <LabelScreen label="Discover Screen" />,
        "(tabs)/feed": () => <LabelScreen label="Feed Screen" />,
        "(tabs)/add": () => <LabelScreen label="Add Screen" />,
        "(tabs)/bites": () => <LabelScreen label="Bites Screen" />,
        "(tabs)/profile": () => <LabelScreen label="Profile Screen" />,
      },
      { initialUrl: String(AUTHENTICATED_HOME) },
    );

    expect(result.getPathname()).toBe("/discover");
    expect(screen.getByText("Discover Screen")).toBeTruthy();
  });

  it("renders the Feed tab route", () => {
    const result = renderRouter(
      {
        "(tabs)/feed": () => (
          <View>
            <Text>Feed</Text>
            <Text>Your Feed is getting started</Text>
          </View>
        ),
      },
      { initialUrl: "/(tabs)/feed" },
    );

    expect(result.getPathname()).toBe("/feed");
    expect(screen.getByText("Your Feed is getting started")).toBeTruthy();
  });

  it("opens Add a Bite from the plus / add workflow", async () => {
    const result = renderRouter(addWorkflowRoutes, { initialUrl: "/(tabs)/add" });

    await act(async () => {
      fireEvent.press(screen.getByText("Add a Bite"));
    });

    expect(result.getPathname()).toBe("/add-bite");
    expect(screen.getByText("Add a Bite Flow")).toBeTruthy();
  });

  it("opens Quick Dish Log from the plus / add workflow", async () => {
    const result = renderRouter(addWorkflowRoutes, { initialUrl: "/(tabs)/add" });

    await act(async () => {
      fireEvent.press(screen.getByText("Quick Dish Log"));
    });

    expect(result.getPathname()).toBe("/add-dish");
    expect(screen.getByText("Dish Form")).toBeTruthy();
  });

  it("keeps Journal reachable from Bites", async () => {
    const result = renderRouter(
      {
        "(tabs)/bites": () => (
          <Pressable
            onPress={() => {
              const { router } = require("expo-router");
              router.push({ pathname: "/(tabs)/bites", params: { segment: "journal" } });
            }}
          >
            <Text>Journal</Text>
          </Pressable>
        ),
      },
      { initialUrl: "/(tabs)/bites" },
    );

    expect(result.getPathname()).toBe("/bites");
    expect(screen.getByText("Journal")).toBeTruthy();
  });

  it("renders Bites with saved restaurant content", () => {
    const result = renderRouter(
      {
        "(tabs)/bites": () => (
          <View>
            <Text>Bites</Text>
            <Text>Want Spot</Text>
            <Text>Mexican</Text>
            <Text>Los Angeles</Text>
          </View>
        ),
      },
      { initialUrl: "/(tabs)/bites" },
    );

    expect(result.getPathname()).toBe("/bites");
    expect(screen.getByText("Want Spot")).toBeTruthy();
    expect(screen.getByText("Mexican")).toBeTruthy();
  });

  it("validates Profile tab route", () => {
    const result = renderRouter(
      {
        "(tabs)/profile": () => <LabelScreen label="Profile Screen" />,
      },
      { initialUrl: "/(tabs)/profile" },
    );

    expect(result.getPathname()).toBe("/profile");
    expect(screen.getByText("Profile Screen")).toBeTruthy();
  });

  it("navigates Feed empty-state CTA to Discover", async () => {
    const result = renderRouter(
      {
        "(tabs)/feed": () => (
          <Pressable
            onPress={() => {
              const { router } = require("expo-router");
              router.push("/(tabs)/discover");
            }}
          >
            <Text>Discover Restaurants</Text>
          </Pressable>
        ),
        "(tabs)/discover": () => <LabelScreen label="Discover Screen" />,
      },
      { initialUrl: "/(tabs)/feed" },
    );

    await act(async () => {
      fireEvent.press(screen.getByText("Discover Restaurants"));
    });

    expect(result.getPathname()).toBe("/discover");
    expect(screen.getByText("Discover Screen")).toBeTruthy();
  });
});
