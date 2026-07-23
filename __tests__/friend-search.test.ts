import {
  FRIEND_SEARCH_RESULT_LIMIT,
  normalizeFriendSearchQuery,
  searchAppUsers,
  userMatchesFriendSearch,
} from "@/lib/friend-search";
import type { User } from "@/lib/types";

function user(partial: Partial<User> & Pick<User, "id" | "displayName" | "username">): User {
  return {
    email: `${partial.username}@example.com`,
    avatarUrl: null,
    city: partial.city ?? "",
    bio: null,
    favoriteCuisines: [],
    hasCompletedTasteQuiz: false,
    createdAt: "2024-01-01T00:00:00Z",
    ...partial,
  };
}

const me = user({ id: "me", displayName: "Alex Rivera", username: "alextastes", city: "Los Angeles" });
const jordan = user({ id: "u2", displayName: "Jordan Kim", username: "jordanbites", city: "New York" });
const sam = user({ id: "u3", displayName: "Sam Patel", username: "samspoon", city: "Chicago" });
const maya = user({ id: "u4", displayName: "Maya Chen", username: "mayaeats", city: "Miami" });

describe("friend search", () => {
  it("strips leading @ and trims query", () => {
    expect(normalizeFriendSearchQuery("  @JordanBites  ")).toBe("jordanbites");
    expect(normalizeFriendSearchQuery("Maya")).toBe("maya");
  });

  it("matches display name, username, and city", () => {
    expect(userMatchesFriendSearch(jordan, "jord")).toBe(true);
    expect(userMatchesFriendSearch(jordan, "@jordanbites")).toBe(true);
    expect(userMatchesFriendSearch(jordan, "New York")).toBe(true);
    expect(userMatchesFriendSearch(jordan, "zzz")).toBe(false);
  });

  it("finds anyone on the app — including people you already follow", () => {
    const results = searchAppUsers([me, jordan, sam, maya], {
      query: "Jordan",
      currentUserId: me.id,
    });
    expect(results.map((u) => u.id)).toEqual(["u2"]);
  });

  it("finds users by @username even when already following them", () => {
    const results = searchAppUsers([me, jordan, sam], {
      query: "@samspoon",
      currentUserId: me.id,
    });
    expect(results).toHaveLength(1);
    expect(results[0].username).toBe("samspoon");
  });

  it("never returns the current user", () => {
    const results = searchAppUsers([me, jordan], {
      query: "Alex",
      currentUserId: me.id,
    });
    expect(results).toEqual([]);
  });

  it("matches partial first or last name", () => {
    const results = searchAppUsers([me, jordan, maya], {
      query: "chen",
      currentUserId: me.id,
    });
    expect(results.map((u) => u.displayName)).toEqual(["Maya Chen"]);
  });

  it("caps result count", () => {
    expect(FRIEND_SEARCH_RESULT_LIMIT).toBe(20);
    const many = Array.from({ length: 30 }, (_, i) =>
      user({ id: `u-${i}`, displayName: `Friend ${i}`, username: `friend${i}` }),
    );
    const results = searchAppUsers([me, ...many], {
      query: "Friend",
      currentUserId: me.id,
    });
    expect(results).toHaveLength(20);
  });
});
