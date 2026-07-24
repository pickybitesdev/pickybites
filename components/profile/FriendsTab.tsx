import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { sortUsersByTasteMatch } from "@/lib/taste-match";
import { searchAppUsers, normalizeFriendSearchQuery } from "@/lib/friend-search";
import { userProfileHref } from "@/lib/navigation";
import { shareInvite } from "@/lib/share";
import { APP_NAME } from "@/constants/branding";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FriendsSearchBar } from "@/components/profile/FriendsSearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { TasteMatchBadge } from "@/components/social/TasteMatchBadge";
import { ui } from "@/constants/ui";
import { useThemeStore } from "@/store/useThemeStore";
import { iconColors } from "@/constants/ui";

export function FriendsTab({ from = "profile-friends" }: { from?: "profile-friends" | "friends" }) {
  const isDark = useThemeStore((s) => s.resolved) === "dark";
  const { users, currentUserId, reviews, restaurants, isFollowing, toggleFollow, follows } =
    useAppStore();
  const [query, setQuery] = useState("");
  const me = users.find((u) => u.id === currentUserId);
  const hasQuery = normalizeFriendSearchQuery(query).length > 0;

  const followingIds = useMemo(
    () => follows.filter((f) => f.followerId === currentUserId).map((f) => f.followingId),
    [follows, currentUserId],
  );

  const followingSorted = useMemo(() => {
    if (!currentUserId || hasQuery) return [];
    return sortUsersByTasteMatch(currentUserId, followingIds, reviews, restaurants)
      .map((entry) => ({
        ...entry,
        user: users.find((u) => u.id === entry.userId)!,
      }))
      .filter((x) => x.user);
  }, [currentUserId, followingIds, reviews, restaurants, users, hasQuery]);

  /** Browse suggestions: people you do not follow yet (hidden while searching). */
  const discover = useMemo(() => {
    if (hasQuery) return [];
    const others = users.filter((u) => u.id !== currentUserId && !followingIds.includes(u.id));
    if (!currentUserId) {
      return others.map((user) => ({
        user,
        match: { percent: 0, explanations: [] as string[], detail: undefined as string | undefined },
      }));
    }
    return sortUsersByTasteMatch(
      currentUserId,
      others.map((u) => u.id),
      reviews,
      restaurants,
    )
      .map((entry) => ({ ...entry, user: users.find((u) => u.id === entry.userId)! }))
      .filter((x) => x.user);
  }, [users, currentUserId, followingIds, hasQuery, reviews, restaurants]);

  /** Active search: every on-app user matching name / @username / city (including friends). */
  const searchResults = useMemo(() => {
    if (!hasQuery) return [];
    const matched = searchAppUsers(users, { query, currentUserId });
    if (!currentUserId) {
      return matched.map((user) => ({
        user,
        match: { percent: 0, explanations: [] as string[], detail: undefined as string | undefined },
      }));
    }
    return sortUsersByTasteMatch(
      currentUserId,
      matched.map((u) => u.id),
      reviews,
      restaurants,
    )
      .map((entry) => ({ ...entry, user: users.find((u) => u.id === entry.userId)! }))
      .filter((x) => x.user);
  }, [hasQuery, users, query, currentUserId, reviews, restaurants]);

  return (
    <View className="gap-4">
      <FriendsSearchBar value={query} onChangeText={setQuery} />

      <Button
        label={`Invite Friends to ${APP_NAME}`}
        variant="secondary"
        onPress={() => shareInvite(me?.displayName)}
      />

      {hasQuery ? (
        searchResults.length > 0 ? (
          <View className="gap-3" testID="friends-search-results">
            <Text className={`text-sm font-semibold ${ui.text.secondary}`}>Search results</Text>
            {searchResults.map(({ user, match }) => {
              const count = reviews.filter((r) => r.userId === user.id).length;
              const following = isFollowing(user.id);
              return (
                <FriendRow
                  key={user.id}
                  user={user}
                  reviewCount={count}
                  match={match}
                  isFollowing={following}
                  onFollow={() => toggleFollow(user.id)}
                  isDark={isDark}
                  showFollow={!following}
                  from={from}
                />
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon="search-outline"
            title="No one found"
            description={`Try another name or @username. If they’re on ${APP_NAME}, they should show up here.`}
            actionLabel={`Invite to ${APP_NAME}`}
            onAction={() => shareInvite(me?.displayName)}
          />
        )
      ) : (
        <>
          {followingSorted.length > 0 ? (
            <View className="gap-3">
              <Text className={`text-sm font-semibold ${ui.text.secondary}`}>Friends · sorted by taste match</Text>
              {followingSorted.map(({ user, match }) => {
                const count = reviews.filter((r) => r.userId === user.id).length;
                return (
                  <FriendRow
                    key={user.id}
                    user={user}
                    reviewCount={count}
                    match={match}
                    isFollowing={isFollowing(user.id)}
                    onFollow={() => toggleFollow(user.id)}
                    isDark={isDark}
                    from={from}
                  />
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon="people-outline"
              title="No friends yet"
              description="Follow food lovers to compare taste matches and see what they're eating."
              actionLabel={`Invite to ${APP_NAME}`}
              onAction={() => shareInvite(me?.displayName)}
            />
          )}

          {discover.length > 0 && (
            <View className="gap-3">
              <Text className={`text-sm font-semibold ${ui.text.secondary}`}>Discover food lovers</Text>
              {discover.slice(0, 8).map(({ user, match }) => {
                const count = reviews.filter((r) => r.userId === user.id).length;
                return (
                  <FriendRow
                    key={user.id}
                    user={user}
                    reviewCount={count}
                    match={match}
                    isFollowing={false}
                    onFollow={() => toggleFollow(user.id)}
                    isDark={isDark}
                    showFollow
                    from={from}
                  />
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
}

function FriendRow({
  user,
  reviewCount,
  match,
  isFollowing: following,
  onFollow,
  isDark,
  showFollow = false,
  from = "profile-friends",
}: {
  user: { id: string; displayName: string; username: string; avatarUrl: string | null; city: string };
  reviewCount: number;
  match: { percent: number; explanations: string[]; detail?: string };
  isFollowing: boolean;
  onFollow: () => void;
  isDark: boolean;
  showFollow?: boolean;
  from?: "profile-friends" | "friends";
}) {
  const openProfile = () => router.push(userProfileHref(user.id, from === "friends" ? "friends" : undefined));
  return (
    <Card className="gap-3 py-4">
      <View className="flex-row items-start gap-3">
        <Pressable onPress={openProfile}>
          <Avatar name={user.displayName} src={user.avatarUrl} />
        </Pressable>
        <Pressable onPress={openProfile} className="flex-1 gap-1">
          <Text className={`font-semibold ${ui.text.primary}`}>{user.displayName}</Text>
          <Text className={`text-xs ${ui.text.muted}`}>@{user.username} · {reviewCount} reviews</Text>
          {user.city ? <Text className={`text-xs ${ui.text.faint}`}>{user.city}</Text> : null}
        </Pressable>
        {(showFollow || !following) && !following ? (
          <Button label="Follow" onPress={onFollow} className="px-4 py-2 min-h-[40px]" />
        ) : (
          <Pressable onPress={openProfile}>
            <Ionicons name="chevron-forward" size={20} color={isDark ? iconColors.mutedDark : iconColors.muted} />
          </Pressable>
        )}
      </View>
      {match.percent > 0 ? (
        <TasteMatchBadge percent={match.percent} explanations={match.explanations} detail={match.detail} size="sm" />
      ) : (
        <Text className={`text-xs ${ui.text.faint}`}>Rate more spots to unlock taste match</Text>
      )}
    </Card>
  );
}
