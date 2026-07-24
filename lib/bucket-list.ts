import type { Bookmark, BucketListStatus } from "./types";
import type { Coordinates } from "./places/types";
import { distanceMeters } from "./location";
import { formatDistance } from "./utils";
import { BUCKET_LIST_STATUS_LABELS } from "./types";

export type BucketListStats = {
  saved: number;
  visited: number;
  planned: number;
  completionPercent: number;
  monthlyNewCount: number;
};

export type BucketListSections = {
  recentlySaved: Bookmark[];
  plannedThisWeek: Bookmark[];
  completed: Bookmark[];
  active: Bookmark[];
};

function startOfWeek(d = new Date()) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function getBucketListStats(bookmarks: Bookmark[]): BucketListStats {
  const saved = bookmarks.length;
  const visited = bookmarks.filter((b) => b.status === "visited").length;
  const planned = bookmarks.filter((b) => b.status === "planned").length;
  const completionPercent = saved ? Math.round((visited / saved) * 100) : 0;
  const monthStart = startOfMonth().getTime();
  const monthlyNewCount = bookmarks.filter(
    (b) => new Date(b.createdAt).getTime() >= monthStart,
  ).length;

  return { saved, visited, planned, completionPercent, monthlyNewCount };
}

export function getBucketListSections(bookmarks: Bookmark[]): BucketListSections {
  const now = Date.now();
  const weekStart = startOfWeek().getTime();
  const twoWeeksAgo = now - 14 * 86400000;

  const recentlySaved = bookmarks
    .filter((b) => b.status === "want_to_try" && new Date(b.createdAt).getTime() >= twoWeeksAgo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const plannedThisWeek = bookmarks
    .filter((b) => {
      if (b.status !== "planned") return false;
      const plannedAt = b.plannedAt ? new Date(b.plannedAt).getTime() : new Date(b.updatedAt).getTime();
      return plannedAt >= weekStart;
    })
    .sort((a, b) => {
      const aT = a.plannedAt ?? a.updatedAt;
      const bT = b.plannedAt ?? b.updatedAt;
      return new Date(bT).getTime() - new Date(aT).getTime();
    });

  const completed = bookmarks
    .filter((b) => b.status === "visited")
    .sort((a, b) => {
      const aT = a.visitedAt ?? a.updatedAt;
      const bT = b.visitedAt ?? b.updatedAt;
      return new Date(bT).getTime() - new Date(aT).getTime();
    });

  const active = bookmarks
    .filter((b) => b.status !== "visited")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { recentlySaved, plannedThisWeek, completed, active };
}

export function getStatusLabel(status: BucketListStatus): string {
  return BUCKET_LIST_STATUS_LABELS[status];
}

export function formatBookmarkDistance(
  bookmark: Bookmark,
  coords: Coordinates | null,
): string | null {
  if (!coords || bookmark.latitude == null || bookmark.longitude == null) return null;
  const meters = distanceMeters(coords, {
    latitude: bookmark.latitude,
    longitude: bookmark.longitude,
  });
  return formatDistance(meters);
}

export function formatSavedDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatPlannedFor(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function monthlyStreakLabel(count: number): string | null {
  if (count <= 0) return null;
  return `${count} new restaurant${count === 1 ? "" : "s"} this month`;
}
