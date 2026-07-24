import type { Href } from "expo-router";
import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type ProfileMenuItem = {
  href: Href;
  icon: IoniconName;
  label: string;
  desc: string;
  /** Optional metadata key rendered by Profile (e.g. following count). */
  meta?: "followingCount";
};

/**
 * Secondary Profile menu — Friends preview + header CTAs; Settings is header-only.
 * Journal lives on Bites tab.
 */
export const PROFILE_MENU: ProfileMenuItem[] = [];

export const PROFILE_SETTINGS_MIN_TOUCH = 44;

export function profileMenuLabels(items: ProfileMenuItem[] = PROFILE_MENU): string[] {
  return items.map((i) => i.label);
}

export function profileMenuHasSettings(items: ProfileMenuItem[] = PROFILE_MENU): boolean {
  return items.some((i) => i.href === "/settings" || i.label === "Settings");
}

export function profileMenuHasBites(items: ProfileMenuItem[] = PROFILE_MENU): boolean {
  return items.some((i) => i.label === "Bites" || i.href === "/(tabs)/bites" || i.href === "/bookmarks");
}

export function profileMenuHasLists(items: ProfileMenuItem[] = PROFILE_MENU): boolean {
  return items.some((i) => i.label === "Lists" || i.href === "/lists");
}

export function profileMenuHasWrapped(items: ProfileMenuItem[] = PROFILE_MENU): boolean {
  return items.some((i) => i.label === "Food Wrapped" || i.href === "/wrapped");
}

export function profileMenuHasTasteDna(items: ProfileMenuItem[] = PROFILE_MENU): boolean {
  return items.some((i) => i.label === "Taste DNA" || i.href === "/taste-dna");
}

export function profileMenuHasFriends(items: ProfileMenuItem[] = PROFILE_MENU): boolean {
  return items.some((i) => i.label === "Friends" || i.href === "/friends");
}
