import { useState, useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { getLeaderboardRankings } from "@/lib/rankings";
import {
  CUISINE_RANKING_CATEGORIES,
  TAG_RANKING_CATEGORIES,
  getRankingCategoryLabel,
  type RankingCategoryId,
} from "@/lib/ranking-categories";
import { Tag } from "@/components/ui/Tag";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeaderboardHeader, LeaderboardRow, LeaderboardPodium } from "@/components/rankings/Leaderboard";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";

export default function RankingsScreen() {
  const colors = useThemedColors();
  const { currentUserId, reviews, dishes, restaurants } = useAppStore();
  const [categoryId, setCategoryId] = useState<RankingCategoryId>("all");

  const leaderboard = useMemo(
    () =>
      currentUserId
        ? getLeaderboardRankings(currentUserId, categoryId, reviews, restaurants, dishes)
        : [],
    [currentUserId, categoryId, reviews, restaurants, dishes],
  );

  const categoryLabel = getRankingCategoryLabel(categoryId);

  return (
    <SafeAreaView className={`flex-1 ${ui.screen}`} edges={["top"]}>
      <ScrollView contentContainerClassName="px-4 pb-8 gap-5" showsVerticalScrollIndicator={false}>
        <View className="pt-2 gap-1">
          <View className="flex-row items-center gap-2">
            <Ionicons name="trophy" size={26} color={colors.brand} />
            <Text className={`text-3xl font-bold ${ui.text.primary}`}>Rankings</Text>
          </View>
          <Text className={`text-sm ${ui.text.muted}`}>
            Auto-updated leaderboards from your reviews
          </Text>
        </View>

        <View className="gap-2">
          <Text className={`text-xs font-semibold uppercase ${ui.text.muted}`}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {CUISINE_RANKING_CATEGORIES.map((cat) => (
              <Tag
                key={cat.id}
                label={cat.label}
                active={categoryId === cat.id}
                onPress={() => setCategoryId(cat.id)}
                size="sm"
              />
            ))}
          </ScrollView>
        </View>

        <View className="gap-2">
          <Text className={`text-xs font-semibold uppercase ${ui.text.muted}`}>Tags</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {TAG_RANKING_CATEGORIES.map((cat) => (
              <Tag
                key={cat.id}
                label={cat.label}
                active={categoryId === cat.id}
                onPress={() => setCategoryId(cat.id)}
                size="sm"
              />
            ))}
          </ScrollView>
        </View>

        <View className={`rounded-2xl px-4 py-3 ${ui.accentCard}`}>
          <Text className={`text-xs uppercase tracking-widest font-semibold ${ui.text.muted}`}>
            Leaderboard
          </Text>
          <Text className={`text-xl font-black mt-0.5 ${ui.text.primary}`}>{categoryLabel}</Text>
          <Text className={`text-xs mt-1 ${ui.text.secondary}`}>
            {leaderboard.length} restaurant{leaderboard.length === 1 ? "" : "s"} ranked by average score
          </Text>
        </View>

        {leaderboard.length === 0 ? (
          <EmptyState
            icon="trophy-outline"
            title={`No ${categoryLabel} rankings yet`}
            description="Write reviews in this category to build your leaderboard."
            actionLabel="Write a Review"
            onAction={() => router.push("/add-bite")}
          />
        ) : (
          <View className="gap-4">
            {leaderboard.length >= 3 && (
              <LeaderboardPodium
                entries={leaderboard}
                onPress={(entry) => router.push(`/restaurant/${entry.restaurant_id}`)}
              />
            )}

            <LeaderboardHeader />

            <View className="gap-2">
              {leaderboard.map((entry) => (
                <LeaderboardRow
                  key={entry.restaurant_id}
                  entry={entry}
                  onPress={() => router.push(`/restaurant/${entry.restaurant_id}`)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
