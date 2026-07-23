import { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { FeedRestaurantRecItem } from "@/lib/feed/types";
import { formatDistance, formatPrice } from "@/lib/utils";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";
import { FeedItemMenu } from "@/components/feed/FeedItemMenu";
import { wantToTryBookmarkLabel } from "@/lib/bites";

export function FeedRestaurantRecCard({
  item,
  isBookmarked,
  onSave,
  onHideRestaurant,
  onFewerLikeThis,
  onWhy,
}: {
  item: FeedRestaurantRecItem;
  isBookmarked?: boolean;
  onSave: () => void;
  onHideRestaurant: () => void;
  onFewerLikeThis: () => void;
  onWhy: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { restaurant } = item;
  const meta = [
    restaurant.cuisine,
    item.distanceMeters != null ? formatDistance(item.distanceMeters) : null,
    formatPrice(restaurant.priceLevel),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View
      className="mx-4 rounded-2xl overflow-hidden border border-savr-100 dark:border-savr-800 bg-white dark:bg-savr-900"
      testID="feed-restaurant-rec-card"
    >
      <Pressable
        onPress={() => router.push(`/restaurant/${restaurant.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${restaurant.name}, ${item.matchPercent}% match`}
      >
        {restaurant.imageUrl ? (
          <Image source={{ uri: restaurant.imageUrl }} style={{ width: "100%", aspectRatio: 16 / 9 }} contentFit="cover" />
        ) : (
          <View className="w-full aspect-[16/9] items-center justify-center bg-savr-100">
            <Ionicons name="restaurant" size={32} color={brandColors.primary} />
          </View>
        )}
      </Pressable>

      <View className="p-3 gap-2">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1 gap-0.5">
            <Text className={`text-[11px] font-semibold uppercase tracking-wide ${ui.text.muted}`}>
              Recommended for you
            </Text>
            <Text className={`text-base font-bold ${ui.text.primary}`} numberOfLines={2}>
              {restaurant.name}
            </Text>
            {meta ? <Text className={`text-xs ${ui.text.secondary}`}>{meta}</Text> : null}
          </View>
          <View
            style={{ backgroundColor: brandColors.primaryLight }}
            className="rounded-full px-2.5 py-1"
          >
            <Text style={{ color: brandColors.primary }} className="text-xs font-bold">
              {Math.round(item.matchPercent)}% match
            </Text>
          </View>
        </View>

        <Text className={`text-sm leading-5 ${ui.text.secondary}`} numberOfLines={2}>
          {item.reason}
        </Text>

        <View className="flex-row items-center justify-between pt-1">
          <View className="flex-row items-center gap-3">
            {item.communityRating != null ? (
              <Text className={`text-xs font-semibold ${ui.text.secondary}`}>
                ★ {item.communityRating.toFixed(1)}
              </Text>
            ) : null}
            <Pressable
              onPress={onSave}
              accessibilityLabel={wantToTryBookmarkLabel(!!isBookmarked)}
              hitSlop={8}
              className="flex-row items-center gap-1"
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={20}
                color={brandColors.primary}
              />
            </Pressable>
          </View>
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Recommendation options"
            hitSlop={8}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={brandColors.iconInactive} />
          </Pressable>
        </View>
      </View>

      <FeedItemMenu
        visible={menuOpen}
        title="Recommendation"
        onClose={() => setMenuOpen(false)}
        actions={[
          { key: "why", label: "Why am I seeing this?", onPress: onWhy },
          { key: "fewer", label: "Show fewer like this", onPress: onFewerLikeThis },
          { key: "hide", label: "Hide this restaurant", onPress: onHideRestaurant },
          {
            key: "not",
            label: "Not interested",
            destructive: true,
            onPress: () => {
              onHideRestaurant();
              Alert.alert("Got it", "We’ll show fewer recommendations like this.");
            },
          },
        ]}
      />
    </View>
  );
}
