import type { Coordinates } from "@/lib/places/types";
import type { TastePreferences } from "@/lib/taste-preferences";
import type {
  Bookmark,
  Comment,
  Dish,
  Follow,
  Like,
  Restaurant,
  Review,
  ReviewPhoto,
  User,
} from "@/lib/types";
import type { FeedDismissals } from "@/lib/feed-dismissals";
import type { FeedPreferences } from "@/lib/feed-preferences";
import { filterFeedItems } from "@/lib/feed/filter";
import { orderFriendReviews } from "@/lib/feed/rank";
import type { FeedFriendReviewItem, FeedItem, FeedPromptItem } from "@/lib/feed/types";

export type BuildFeedInput = {
  userId: string;
  user: User | null;
  users: User[];
  reviews: Review[];
  restaurants: Restaurant[];
  dishes: Dish[];
  follows: Follow[];
  likes: Like[];
  comments: Comment[];
  reviewPhotos: ReviewPhoto[];
  bookmarks: Bookmark[];
  prefs: FeedPreferences;
  dismissals: FeedDismissals;
  tastePrefs?: TastePreferences | null;
  coords?: Coordinates | null;
  sessionKey?: string;
};

function buildFriendReviews(input: BuildFeedInput): FeedFriendReviewItem[] {
  const followingIds = new Set(
    input.follows.filter((f) => f.followerId === input.userId).map((f) => f.followingId),
  );
  const uMap = new Map(input.users.map((u) => [u.id, u]));
  const rMap = new Map(input.restaurants.map((r) => [r.id, r]));
  const likeCounts = new Map<string, number>();
  input.likes.forEach((l) => likeCounts.set(l.reviewId, (likeCounts.get(l.reviewId) ?? 0) + 1));
  const commentCounts = new Map<string, number>();
  input.comments.forEach((c) =>
    commentCounts.set(c.reviewId, (commentCounts.get(c.reviewId) ?? 0) + 1),
  );
  const photosByReview = new Map<string, string>();
  input.reviewPhotos.forEach((p) => {
    if (!photosByReview.has(p.reviewId)) photosByReview.set(p.reviewId, p.url);
  });

  const items: FeedFriendReviewItem[] = [];

  const sorted = [...input.reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  for (const review of sorted) {
    // Friends feed only — never show your own reviews here (those live in Bites / Journal).
    if (review.userId === input.userId) continue;
    if (!followingIds.has(review.userId)) continue;
    if (review.visibility === "private") continue;
    if (input.dismissals.hiddenReviewIds.includes(review.id)) continue;
    if (input.dismissals.mutedUserIds.includes(review.userId)) continue;

    const author = uMap.get(review.userId);
    const restaurant = rMap.get(review.restaurantId);
    if (!author || !restaurant) continue;

    items.push({
      id: `review:${review.id}`,
      type: "friend_review",
      review,
      author,
      restaurant,
      isOwn: false,
      likeCount: likeCounts.get(review.id) ?? 0,
      commentCount: commentCounts.get(review.id) ?? 0,
      imageUrl: photosByReview.get(review.id) ?? restaurant.imageUrl,
    });
  }

  return orderFriendReviews(
    items,
    input.prefs.sort,
    input.userId,
    input.reviews,
    input.restaurants,
  );
}

function buildPrompts(input: BuildFeedInput, followingCount: number): FeedPromptItem[] {
  const session = input.sessionKey ?? "s";
  const prompts: FeedPromptItem[] = [];
  const myReviews = input.reviews.filter((r) => r.userId === input.userId).length;
  const myBookmarks = input.bookmarks.filter((b) => b.userId === input.userId).length;

  if (followingCount === 0) {
    prompts.push({
      id: `prompt:find_friends:${session}`,
      type: "prompt",
      kind: "find_friends",
      title: "Your Feed is getting started",
      body: "Follow friends or keep rating restaurants to improve your Feed.",
      primaryActionLabel: "Find Friends",
      secondaryActionLabel: "Discover Restaurants",
    });
  }

  if (!(input.user?.hasCompletedTasteQuiz)) {
    prompts.push({
      id: `prompt:complete_taste_dna:${session}`,
      type: "prompt",
      kind: "complete_taste_dna",
      title: "Complete Taste DNA",
      body: "A quick quiz makes recommendations sharper.",
      primaryActionLabel: "Take Taste Quiz",
    });
  }

  if (myReviews < 2) {
    prompts.push({
      id: `prompt:review_restaurant:${session}`,
      type: "prompt",
      kind: "review_restaurant",
      title: "Review another restaurant",
      body: "Each rating teaches PickyBites what you love.",
      primaryActionLabel: "Add a Review",
    });
  }

  if (myBookmarks === 0) {
    prompts.push({
      id: `prompt:save_to_bites:${session}`,
      type: "prompt",
      kind: "save_to_bites",
      title: "Save places to Bites",
      body: "Bookmark spots you want to try so they show up when you need them.",
      primaryActionLabel: "Open Discover",
    });
  }

  // Cap prompts so they never dominate
  return prompts.slice(0, followingCount === 0 ? 2 : 1);
}

/**
 * Build the Feed session. Friends-only: friend reviews (+ empty-state prompts),
 * filtered by Customize prefs.
 */
export function buildMixedFeed(input: BuildFeedInput): FeedItem[] {
  const followingCount = input.follows.filter((f) => f.followerId === input.userId).length;
  const friendReviews = buildFriendReviews(input);
  const prompts = buildPrompts(input, followingCount);

  const findFriendsPrompt =
    followingCount === 0
      ? prompts.find((p) => p.kind === "find_friends") ?? null
      : null;

  const items: FeedItem[] = [
    ...(findFriendsPrompt ? [findFriendsPrompt] : []),
    ...friendReviews,
  ];

  return filterFeedItems(items, input.prefs, input.dismissals, input.coords ?? null);
}
