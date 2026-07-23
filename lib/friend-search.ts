import type { User } from "@/lib/types";

export const FRIEND_SEARCH_RESULT_LIMIT = 20;

/** Normalize typed search: trim, lowercase, strip leading @ for username lookups. */
export function normalizeFriendSearchQuery(query: string): string {
  return query.trim().toLowerCase().replace(/^@+/, "");
}

export function userMatchesFriendSearch(
  user: Pick<User, "displayName" | "username" | "city">,
  query: string,
): boolean {
  const q = normalizeFriendSearchQuery(query);
  if (!q) return false;

  const name = user.displayName.toLowerCase();
  const username = user.username.toLowerCase();
  const city = (user.city ?? "").toLowerCase();

  return name.includes(q) || username.includes(q) || (city.length > 0 && city.includes(q));
}

/**
 * Find anyone on the app matching name / @username / city.
 * Includes people you already follow — search should never hide on-app users.
 */
export function searchAppUsers(
  users: User[],
  opts: {
    query: string;
    currentUserId: string | null | undefined;
    limit?: number;
  },
): User[] {
  const q = normalizeFriendSearchQuery(opts.query);
  if (!q) return [];

  const limit = opts.limit ?? FRIEND_SEARCH_RESULT_LIMIT;
  return users
    .filter((u) => u.id !== opts.currentUserId && userMatchesFriendSearch(u, q))
    .slice(0, limit);
}
