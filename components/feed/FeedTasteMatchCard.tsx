import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { FeedTasteMatchRecItem } from "@/lib/feed/types";
import { formatPrice } from "@/lib/utils";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";
import { wantToTryBookmarkLabel } from "@/lib/bites";

export function FeedTasteMatchCard({
  item,
  onSave,
}: {
  item: FeedTasteMatchRecItem;
  onSave: () => void;
}) {
  const { restaurant } = item;
  return (
    <Pressable
      onPress={() => router.push(`/restaurant/${restaurant.id}`)}
      testID="feed-taste-match-card"
      className="mx-4 rounded-2xl overflow-hidden border border-savr-100 dark:border-savr-800 bg-white dark:bg-savr-900"
    >
      {restaurant.imageUrl ? (
        <Image source={{ uri: restaurant.imageUrl }} style={{ width: "100%", aspectRatio: 2 }} contentFit="cover" />
      ) : (
        <View className="w-full aspect-[2/1] items-center justify-center bg-savr-100">
          <Ionicons name="people" size={28} color={brandColors.primary} />
        </View>
      )}
      <View className="p-3 gap-1.5">
        <Text className={`text-[11px] font-semibold uppercase tracking-wide ${ui.text.muted}`}>
          People with similar taste loved this
        </Text>
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text className={`text-base font-bold ${ui.text.primary}`}>{restaurant.name}</Text>
            <Text className={`text-xs ${ui.text.secondary}`}>
              {restaurant.cuisine} · {formatPrice(restaurant.priceLevel)}
            </Text>
          </View>
          <View style={{ backgroundColor: brandColors.primaryLight }} className="rounded-full px-2.5 py-1">
            <Text style={{ color: brandColors.primary }} className="text-xs font-bold">
              {Math.round(item.matchPercent)}%
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className={`text-xs ${ui.text.secondary}`} numberOfLines={2}>
            {item.reason} · {item.similarUserCount} similar{" "}
            {item.similarUserCount === 1 ? "foodie" : "foodies"}
          </Text>
          <Pressable
            onPress={onSave}
            hitSlop={8}
            accessibilityLabel={wantToTryBookmarkLabel(false)}
          >
            <Ionicons name="bookmark-outline" size={20} color={brandColors.primary} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
