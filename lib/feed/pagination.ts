import { FEED_NEXT_PAGE_SIZE, FEED_PAGE_SIZE, type FeedItem } from "@/lib/feed/types";

export type FeedPageState = {
  sessionItems: FeedItem[];
  visible: FeedItem[];
  cursor: number;
  hasMore: boolean;
};

export function createFeedPageState(sessionItems: FeedItem[], pageSize = FEED_PAGE_SIZE): FeedPageState {
  const visible = sessionItems.slice(0, pageSize);
  return {
    sessionItems,
    visible,
    cursor: visible.length,
    hasMore: visible.length < sessionItems.length,
  };
}

export function loadMoreFeedItems(
  state: FeedPageState,
  pageSize = FEED_NEXT_PAGE_SIZE,
): FeedPageState {
  if (!state.hasMore) return state;
  const next = state.sessionItems.slice(state.cursor, state.cursor + pageSize);
  // Prevent duplicates across pages
  const seen = new Set(state.visible.map((i) => i.id));
  const appended = next.filter((i) => !seen.has(i.id));
  const visible = [...state.visible, ...appended];
  const cursor = state.cursor + next.length;
  return {
    sessionItems: state.sessionItems,
    visible,
    cursor,
    hasMore: cursor < state.sessionItems.length,
  };
}

export function resetFeedPage(sessionItems: FeedItem[], pageSize = FEED_PAGE_SIZE): FeedPageState {
  return createFeedPageState(sessionItems, pageSize);
}
