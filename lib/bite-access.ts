import type { ReviewVisibility } from "@/lib/types";

/** Whether the current user may open a Bite / review detail screen. */
export function canViewBiteReview(opts: {
  reviewUserId: string;
  visibility: ReviewVisibility;
  currentUserId: string | null;
  isFollowingAuthor: boolean;
}): boolean {
  const { reviewUserId, visibility, currentUserId, isFollowingAuthor } = opts;
  if (!currentUserId) return visibility === "public";
  if (reviewUserId === currentUserId) return true;
  if (visibility === "public") return true;
  if (visibility === "friends" && isFollowingAuthor) return true;
  return false;
}
