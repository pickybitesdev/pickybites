import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAppStore } from "@/store/useAppStore";
import { getCompareRankings } from "@/lib/compare";
import { Card } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ui } from "@/constants/ui";

export default function CompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUserId, getUser, reviews, restaurants } = useAppStore();
  const me = currentUserId ? getUser(currentUserId) : null;
  const friend = getUser(id!);

  if (!me || !friend || !currentUserId) {
    return (
      <View className="flex-1 items-center justify-center bg-savr-50 dark:bg-savr-950">
        <Text className={ui.text.muted}>Could not load comparison.</Text>
      </View>
    );
  }

  const compare = getCompareRankings(currentUserId, id!, reviews, restaurants, 10);

  return (
    <ScrollView className="flex-1 bg-savr-50 dark:bg-savr-950" contentContainerClassName="px-4 pb-8 gap-4">
      <View className="flex-row items-center justify-center gap-4 pt-2">
        <View className="items-center gap-1">
          <Avatar name={me.displayName} src={me.avatarUrl} />
          <Text className="text-sm font-semibold text-savr-900 dark:text-savr-100">You</Text>
        </View>
        <Text className="text-lg font-bold text-savr-400">vs</Text>
        <View className="items-center gap-1">
          <Avatar name={friend.displayName} src={friend.avatarUrl} />
          <Text className="text-sm font-semibold text-savr-900 dark:text-savr-100">{friend.displayName}</Text>
        </View>
      </View>

      {compare.shared.length > 0 && (
        <View className="gap-2">
          <Text className="font-semibold text-savr-900 dark:text-savr-100">
            Shared spots ({compare.shared.length})
          </Text>
          {compare.shared.slice(0, 5).map(({ restaurant, myRating, theirRating, diff }) => (
            <Card key={restaurant.id} className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="font-medium text-savr-900 dark:text-savr-100">{restaurant.name}</Text>
                <Text className={`text-xs ${ui.text.muted}`}>{restaurant.cuisine}</Text>
              </View>
              <View className="items-end gap-0.5">
                <Text className={`text-xs ${ui.text.muted}`}>You {myRating.toFixed(1)} · Them {theirRating.toFixed(1)}</Text>
                <Text className="text-xs font-medium text-savr-350 dark:text-savr-300">
                  {diff < 0.5 ? "Almost identical!" : `${diff.toFixed(1)} pt diff`}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      <View className="flex-row gap-3">
        <View className="flex-1 gap-2">
          <Text className="font-semibold text-savr-900 dark:text-savr-100 text-center">Your Top 10</Text>
          {compare.mine.length === 0 ? (
            <EmptyState icon="restaurant-outline" title="No ratings yet" />
          ) : (
            compare.mine.map((entry) => (
              <Card key={entry.restaurant.id} className="flex-row items-center gap-2 py-2.5">
                <Text className={`w-6 font-bold text-center ${ui.text.muted}`}>{entry.rank}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-savr-900 dark:text-savr-100" numberOfLines={1}>
                    {entry.restaurant.name}
                  </Text>
                </View>
                <Rating value={entry.rating} size="sm" />
              </Card>
            ))
          )}
        </View>

        <View className="flex-1 gap-2">
          <Text className="font-semibold text-savr-900 dark:text-savr-100 text-center">Their Top 10</Text>
          {compare.theirs.length === 0 ? (
            <EmptyState icon="restaurant-outline" title="No ratings yet" />
          ) : (
            compare.theirs.map((entry) => (
              <Card key={entry.restaurant.id} className="flex-row items-center gap-2 py-2.5">
                <Text className={`w-6 font-bold text-center ${ui.text.muted}`}>{entry.rank}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-savr-900 dark:text-savr-100" numberOfLines={1}>
                    {entry.restaurant.name}
                  </Text>
                </View>
                <Rating value={entry.rating} size="sm" />
              </Card>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

