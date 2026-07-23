import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { FeedDishRecItem } from "@/lib/feed/types";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";
import { wantToTryBookmarkLabel } from "@/lib/bites";

export function FeedDishRecCard({
  item,
  onSave,
}: {
  item: FeedDishRecItem;
  onSave: () => void;
}) {
  const image = item.dish.photoUrl ?? item.restaurant.imageUrl;

  return (
    <Pressable
      onPress={() => router.push(`/restaurant/${item.restaurant.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${item.dish.name} at ${item.restaurant.name}`}
      testID="feed-dish-rec-card"
      className="mx-4 flex-row rounded-2xl overflow-hidden border border-savr-100 dark:border-savr-800 bg-white dark:bg-savr-900"
      style={{ minHeight: 112 }}
    >
      {image ? (
        <Image source={{ uri: image }} style={{ width: 112, height: "100%" }} contentFit="cover" />
      ) : (
        <View className="w-28 items-center justify-center bg-savr-100">
          <Ionicons name="fast-food" size={28} color={brandColors.primary} />
        </View>
      )}
      <View className="flex-1 p-3 justify-between">
        <View className="gap-0.5">
          <Text className={`text-[11px] font-semibold uppercase tracking-wide ${ui.text.muted}`}>
            A dish you may love
          </Text>
          <Text className={`text-[15px] font-bold ${ui.text.primary}`} numberOfLines={1}>
            {item.dish.name}
          </Text>
          <Text className={`text-xs ${ui.text.secondary}`} numberOfLines={1}>
            {item.restaurant.name} · {item.restaurant.cuisine}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className={`text-xs font-semibold ${ui.text.secondary}`}>
              ★ {item.dishScore.toFixed(1)}
            </Text>
            <Text className={`text-[11px] flex-1 ${ui.text.muted}`} numberOfLines={1}>
              {item.reason}
            </Text>
          </View>
          <Pressable onPress={onSave} hitSlop={8} accessibilityLabel={wantToTryBookmarkLabel(false)}>
            <Ionicons name="bookmark-outline" size={20} color={brandColors.primary} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
