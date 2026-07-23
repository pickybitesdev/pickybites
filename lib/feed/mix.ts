import type { FeedPreferences } from "@/lib/feed-preferences";
import { dedupeFeedItems } from "@/lib/feed/filter";
import {
  DEFAULT_FEED_MIX_WEIGHTS,
  FEED_CANDIDATE_CAP,
  feedItemRestaurantId,
  isDiscoveryType,
  isFriendActivityType,
  isPersonalizedType,
  type FeedItem,
  type FeedMixWeights,
  type FeedPromptItem,
} from "@/lib/feed/types";

export type FeedCandidatePools = {
  personalized: FeedItem[];
  friendActivity: FeedItem[];
  discovery: FeedItem[];
};

export function resolveMixWeights(
  prefs: FeedPreferences,
  poolSizes: { personalized: number; friendActivity: number; discovery: number },
  followingCount: number,
): FeedMixWeights {
  let weights = { ...DEFAULT_FEED_MIX_WEIGHTS };

  if (prefs.balance === "recommendations") {
    weights = { personalized: 0.65, friendActivity: 0.2, discovery: 0.15 };
  } else if (prefs.balance === "friends") {
    weights = { personalized: 0.2, friendActivity: 0.65, discovery: 0.15 };
  }

  if (followingCount === 0) {
    weights = {
      personalized: Math.max(weights.personalized, 0.7),
      friendActivity: 0,
      discovery: Math.max(weights.discovery, 0.25),
    };
  }

  if (poolSizes.personalized < 3 && poolSizes.friendActivity > 0) {
    weights = {
      personalized: 0.2,
      friendActivity: 0.6,
      discovery: 0.2,
    };
  }

  if (poolSizes.personalized < 2 && poolSizes.friendActivity < 2) {
    weights = {
      personalized: 0.35,
      friendActivity: 0.25,
      discovery: 0.4,
    };
  }

  const sum = weights.personalized + weights.friendActivity + weights.discovery;
  return {
    personalized: weights.personalized / sum,
    friendActivity: weights.friendActivity / sum,
    discovery: weights.discovery / sum,
  };
}

/**
 * Interleave pools by weight. Avoids adjacent same type and same restaurant.
 */
export function mixFeedItems(
  pools: FeedCandidatePools,
  weights: FeedMixWeights,
  opts?: { cap?: number; findFriendsPrompt?: FeedPromptItem | null },
): FeedItem[] {
  const cap = opts?.cap ?? FEED_CANDIDATE_CAP;
  const queues = {
    personalized: [...pools.personalized],
    friendActivity: [...pools.friendActivity],
    discovery: [...pools.discovery],
  };

  const out: FeedItem[] = [];
  const take = (bucket: keyof typeof queues): FeedItem | null => {
    const n = queues[bucket].length;
    for (let i = 0; i < n; i++) {
      const next = queues[bucket].shift()!;
      const last = out[out.length - 1];
      const rid = feedItemRestaurantId(next);
      const lastRid = last ? feedItemRestaurantId(last) : null;
      const typeConflict = Boolean(last && last.type === next.type);
      const restConflict = Boolean(rid && lastRid && rid === lastRid);
      // Prefer not adjacent, but never drop — rotate and accept on last try.
      if ((typeConflict || restConflict) && i < n - 1) {
        queues[bucket].push(next);
        continue;
      }
      return next;
    }
    return null;
  };

  // Inject Find Friends prompt early when no follows
  if (opts?.findFriendsPrompt) {
    out.push(opts.findFriendsPrompt);
  }

  let guard = 0;
  while (out.length < cap && guard < cap * 4) {
    guard += 1;
    const remaining = {
      personalized: queues.personalized.length,
      friendActivity: queues.friendActivity.length,
      discovery: queues.discovery.length,
    };
    const totalLeft = remaining.personalized + remaining.friendActivity + remaining.discovery;
    if (totalLeft === 0) break;

    const scores = {
      personalized: remaining.personalized > 0 ? weights.personalized : 0,
      friendActivity: remaining.friendActivity > 0 ? weights.friendActivity : 0,
      discovery: remaining.discovery > 0 ? weights.discovery : 0,
    };
    const scoreSum = scores.personalized + scores.friendActivity + scores.discovery;
    if (scoreSum === 0) break;

    // Deterministic pick: choose bucket with highest remaining*weight deficit
    const counts = {
      personalized: out.filter((i) => isPersonalizedType(i.type)).length,
      friendActivity: out.filter((i) => isFriendActivityType(i.type)).length,
      discovery: out.filter((i) => isDiscoveryType(i.type)).length,
    };
    const filled = Math.max(1, out.length);
    const deficit = {
      personalized: scores.personalized / scoreSum - counts.personalized / filled,
      friendActivity: scores.friendActivity / scoreSum - counts.friendActivity / filled,
      discovery: scores.discovery / scoreSum - counts.discovery / filled,
    };

    const order = (Object.keys(deficit) as (keyof typeof deficit)[]).sort(
      (a, b) => deficit[b] - deficit[a],
    );

    let picked: FeedItem | null = null;
    for (const bucket of order) {
      picked = take(bucket);
      if (picked) break;
    }
    // Fallback: any remaining
    if (!picked) {
      picked = take("personalized") ?? take("friendActivity") ?? take("discovery");
    }
    if (!picked) break;
    out.push(picked);
  }

  return dedupeFeedItems(out);
}

/** Partition mixed items back into buckets for testing / rebuild. */
export function partitionByBucket(items: FeedItem[]): FeedCandidatePools {
  return {
    personalized: items.filter((i) => isPersonalizedType(i.type)),
    friendActivity: items.filter((i) => isFriendActivityType(i.type)),
    discovery: items.filter((i) => isDiscoveryType(i.type)),
  };
}
