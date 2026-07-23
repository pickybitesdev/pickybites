import { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { sortUsersByTasteMatch } from "@/lib/taste-match";
import { userProfileHref } from "@/lib/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TasteMatchBadge } from "@/components/social/TasteMatchBadge";
import { ui } from "@/constants/ui";
import { useThemeStore } from "@/store/useThemeStore";
import { iconColors } from "@/constants/ui";

const PREVIEW_LIMIT = 5;

export const PROFILE_FRIENDS_PREVIEW_LIMIT = PREVIEW_LIMIT;

export function ProfileFriendsPreview() {
  const isDark = useThemeStore((s) => s.resolved) === "dark";
  const { users, currentUserId, reviews, restaurants, follows } = useAppStore();

  const followingIds = useMemo(
    () => follows.filter((f) => f.followerId === currentUserId).map((f) => f.followingId),
    [follows, currentUserId],
  );

  const followingSorted = useMemo(() => {
    if (!currentUserId) return [];
    return sortUsersByTasteMatch(currentUserId, followingIds, reviews, restaurants)
      .map((entry) => ({
        ...entry,
        user: users.find((u) => u.id === entry.userId)!,
      }))
      .filter((x) => x.user)
      .slice(0, PREVIEW_LIMIT);
  }, [currentUserId, followingIds, reviews, restaurants, users]);

  const openFriends = () => router.push("/friends");

  if (followingSorted.length === 0) {
    return (
      <View className="px-4 gap-2" testID="profile-friends-preview">
        <Text className={`text-sm font-semibold ${ui.text.secondary}`}>
          Friends — sorted by taste match
        </Text>
        <EmptyState
          icon="people-outline"
          title="No friends yet"
          description="Find people and compare how your tastes line up."
          actionLabel="Find Friends"
          onAction={openFriends}
        />
      </View>
    );
  }

  return (
    <View className="px-4 gap-3" testID="profile-friends-preview">
      <View className="flex-row items-end justify-between">
        <Text className={`text-sm font-semibold ${ui.text.secondary}`}>
          Friends — sorted by taste match
        </Text>
        <Pressable
          onPress={openFriends}
          hitSlop={8}
          accessibilityLabel="See all friends"
          testID="profile-friends-see-all"
        >
          <Text className="text-sm font-semibold text-savr-350 dark:text-savr-400">See all</Text>
        </Pressable>
      </View>

      {followingSorted.map(({ user, match }) => {
        const reviewCount = reviews.filter((r) => r.userId === user.id).length;
        return (
          <Card key={user.id} className="gap-3 py-4">
            <View className="flex-row items-start gap-3">
              <Pressable onPress={() => router.push(userProfileHref(user.id))}>
                <Avatar name={user.displayName} src={user.avatarUrl} />
              </Pressable>
              <Pressable
                onPress={() => router.push(userProfileHref(user.id))}
                className="flex-1 gap-1"
              >
                <Text className={`font-semibold ${ui.text.primary}`}>{user.displayName}</Text>
                <Text className={`text-xs ${ui.text.muted}`}>
                  @{user.username} · {reviewCount} reviews
                </Text>
                {user.city ? <Text className={`text-xs ${ui.text.faint}`}>{user.city}</Text> : null}
              </Pressable>
              <Pressable onPress={() => router.push(userProfileHref(user.id))} hitSlop={8}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? iconColors.mutedDark : iconColors.muted}
                />
              </Pressable>
            </View>
            {match.percent > 0 ? (
              <TasteMatchBadge
                percent={match.percent}
                explanations={match.explanations}
                detail={match.detail}
                size="sm"
              />
            ) : (
              <Text className={`text-xs ${ui.text.faint}`}>
                Rate more spots to unlock taste match
              </Text>
            )}
          </Card>
        );
      })}

      {followingIds.length > PREVIEW_LIMIT ? (
        <Button
          label="See all friends"
          variant="secondary"
          onPress={openFriends}
          testID="profile-friends-see-all-button"
        />
      ) : null}
    </View>
  );
}
