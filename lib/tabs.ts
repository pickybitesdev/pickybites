import type { Href } from "expo-router";
import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type VisibleTabName = "discover" | "feed" | "add" | "bites" | "profile";
export type HiddenTabName = "index" | "journal";
export type TabName = VisibleTabName | HiddenTabName;

export type TabDefinition = {
  name: TabName;
  title: string;
  href: Href | null;
  icon: { focused: IoniconName; unfocused: IoniconName };
  /** Center create button — no visible label in the tab bar. */
  isCenterAction?: boolean;
  /** Hidden from the tab bar but route kept for deep links. */
  hidden?: boolean;
};

/** Default destination after auth / taste quiz when the user is fully set up. */
export const AUTHENTICATED_HOME = "/(tabs)/discover" as const satisfies Href;

/**
 * Bottom tab configuration in display order.
 * Hidden tabs (Home, Journal) stay registered for deep links but are omitted from the bar.
 */
export const TAB_DEFINITIONS: TabDefinition[] = [
  {
    name: "discover",
    title: "Discover",
    href: "/(tabs)/discover",
    icon: { focused: "compass", unfocused: "compass-outline" },
  },
  {
    name: "feed",
    title: "Feed",
    href: "/(tabs)/feed",
    icon: { focused: "newspaper", unfocused: "newspaper-outline" },
  },
  {
    name: "add",
    title: "Add",
    href: "/(tabs)/add",
    icon: { focused: "add", unfocused: "add" },
    isCenterAction: true,
  },
  {
    name: "bites",
    title: "Bites",
    href: "/(tabs)/bites",
    icon: { focused: "bookmark", unfocused: "bookmark-outline" },
  },
  {
    name: "profile",
    title: "Profile",
    href: "/(tabs)/profile",
    icon: { focused: "person", unfocused: "person-outline" },
  },
  {
    name: "index",
    title: "Home",
    href: null,
    icon: { focused: "home", unfocused: "home-outline" },
    hidden: true,
  },
  {
    name: "journal",
    title: "Journal",
    href: null,
    icon: { focused: "book", unfocused: "book-outline" },
    hidden: true,
  },
];

export const VISIBLE_TAB_ORDER: VisibleTabName[] = TAB_DEFINITIONS.filter(
  (t): t is TabDefinition & { name: VisibleTabName } => !t.hidden,
).map((t) => t.name);

export const VISIBLE_TAB_LABELS = TAB_DEFINITIONS.filter((t) => !t.hidden).map((t) =>
  t.isCenterAction ? "+" : t.title,
);

export function getVisibleTabs(): TabDefinition[] {
  return TAB_DEFINITIONS.filter((t) => !t.hidden);
}

export function getTabDefinition(name: TabName): TabDefinition | undefined {
  return TAB_DEFINITIONS.find((t) => t.name === name);
}

export function isVisibleTab(name: string): name is VisibleTabName {
  return VISIBLE_TAB_ORDER.includes(name as VisibleTabName);
}
