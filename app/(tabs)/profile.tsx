import { useRef } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useScrollToTop } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { calculateTasteDNA } from "@/lib/taste-dna";
import { PROFILE_MENU, PROFILE_SETTINGS_MIN_TOUCH } from "@/lib/profile-menu";
import { ProfileFriendsPreview } from "@/components/profile/ProfileFriendsPreview";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { useThemeStore } from "@/store/useThemeStore";
import { useThemedColors } from "@/lib/useThemedColors";
import { iconColors, ui } from "@/constants/ui";
import { cn } from "@/lib/utils";

export default function ProfileScreen() {
  const isDark = useThemeStore((s) => s.resolved) === "dark";
  const colors = useThemedColors();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const { currentUserId, users, reviews, dishes, restaurants, follows } = useAppStore();
  const user = users.find((u) => u.id === currentUserId);
  const userReviews = reviews.filter((r) => r.userId === currentUserId);
  const dna = currentUserId ? calculateTasteDNA(currentUserId, reviews, dishes, restaurants) : null;
  const badgeLabel = dna?.personality?.label ?? "New Explorer";
  const followerCount = follows.filter((f) => f.followingId === currentUserId).length;
  const followingCount = follows.filter((f) => f.followerId === currentUserId).length;

  if (!user) {
    return (
      <SafeAreaView className={`flex-1 ${ui.screen}`} edges={["top"]} testID="profile-screen-empty">
        <View className="flex-1 px-6 items-center justify-center gap-4">
          <Text className={`text-xl font-bold text-center ${ui.text.primary}`}>
            Profile not loaded
          </Text>
          <Text className={`text-sm text-center ${ui.text.muted}`}>
            Your account session is active, but we couldn&apos;t find your profile data. Try Demo
            for a full sample account, or sign out and create a new account.
          </Text>
          <Button
            label="Try Demo — Alex Rivera"
            variant="demo"
            onPress={async () => {
              await useAppStore.getState().demoLogin();
            }}
            testID="profile-empty-demo"
          />
          <Button
            label="Sign out"
            variant="secondary"
            onPress={async () => {
              await useAppStore.getState().logout();
              router.replace("/login");
            }}
            testID="profile-empty-sign-out"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${ui.screen}`} edges={["top"]} testID="profile-screen">
      <ScrollView
        ref={scrollRef}
        contentContainerClassName="pb-28 gap-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-2 flex-row items-center justify-between">
          <Text className={`text-2xl font-bold ${ui.text.primary}`}>Profile</Text>
          <Pressable
            onPress={() => router.push("/settings")}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            testID="profile-settings-button"
            hitSlop={8}
            style={{
              minWidth: PROFILE_SETTINGS_MIN_TOUCH,
              minHeight: PROFILE_SETTINGS_MIN_TOUCH,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="settings-outline" size={24} color={colors.brand} />
          </Pressable>
        </View>

        <View className={cn("mx-4 rounded-3xl overflow-hidden", ui.accentCard)}>
          <View className="items-center px-6 py-7 gap-3">
            <Avatar name={user.displayName} src={user.avatarUrl} size="xl" />
            <Text className={`text-2xl font-bold ${ui.text.primary}`}>{user.displayName}</Text>
            <Text className={`text-sm ${ui.text.muted}`}>@{user.username}</Text>
            <Pressable
              onPress={() => router.push("/taste-dna")}
              accessibilityRole="button"
              accessibilityLabel={`Taste DNA badge: ${badgeLabel}`}
              accessibilityHint="Opens your Taste DNA profile"
              testID="profile-taste-dna-badge"
            >
              <Tag label={badgeLabel} active size="sm" />
            </Pressable>
            {user.bio ? (
              <Text className={`text-sm text-center ${ui.text.secondary}`}>{user.bio}</Text>
            ) : null}
          </View>

          <View className="flex-row border-t border-savr-200/60 dark:border-savr-700/60">
            <View className="flex-1 items-center py-4 px-1">
              <Text className={`text-xl font-bold ${ui.text.primary}`}>{userReviews.length}</Text>
              <Text className={`text-xs ${ui.text.muted}`}>Reviews</Text>
            </View>
            <View className="w-px bg-savr-200/60 dark:bg-savr-700/60" />
            <Pressable
              onPress={() => router.push("/friends")}
              accessibilityRole="button"
              accessibilityLabel={`${followerCount} followers`}
              accessibilityHint="Opens your friends list"
              testID="profile-followers-stat"
              className="flex-1 items-center py-4 px-1"
            >
              <Text className={`text-xl font-bold ${ui.text.primary}`}>{followerCount}</Text>
              <Text className={`text-xs mt-0.5 ${ui.text.muted}`}>Followers</Text>
            </Pressable>
            <View className="w-px bg-savr-200/60 dark:bg-savr-700/60" />
            <Pressable
              onPress={() => router.push("/friends")}
              accessibilityRole="button"
              accessibilityLabel={`${followingCount} following`}
              accessibilityHint="Opens your friends list"
              testID="profile-following-stat"
              className="flex-1 items-center py-4 px-1"
            >
              <Text className={`text-xl font-bold ${ui.text.primary}`}>{followingCount}</Text>
              <Text className={`text-xs mt-0.5 ${ui.text.muted}`}>Following</Text>
            </Pressable>
          </View>
        </View>

        <View className="px-4 flex-row gap-3">
          <Button
            label="Edit Profile"
            variant="secondary"
            className="flex-1"
            onPress={() => router.push("/edit-profile")}
            testID="profile-edit-button"
          />
          <Button
            label="Find Friends"
            className="flex-1"
            onPress={() => router.push("/friends")}
            testID="profile-find-friends-button"
          />
        </View>

        <ProfileFriendsPreview />

        {PROFILE_MENU.length > 0 ? (
          <View className="px-4 gap-3">
            {PROFILE_MENU.map((m) => (
              <Pressable
                key={String(m.href)}
                onPress={() => router.push(m.href)}
                testID={`profile-menu-${m.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Card className="flex-row items-center gap-4 py-4">
                  <View
                    className={`w-11 h-11 rounded-2xl items-center justify-center ${ui.surface.muted}`}
                  >
                    <Ionicons
                      name={m.icon}
                      size={22}
                      color={isDark ? iconColors.brandDark : iconColors.brand}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-semibold text-base ${ui.text.primary}`}>{m.label}</Text>
                    <Text className={`text-xs mt-0.5 ${ui.text.muted}`}>{m.desc}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isDark ? iconColors.mutedDark : iconColors.muted}
                  />
                </Card>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
