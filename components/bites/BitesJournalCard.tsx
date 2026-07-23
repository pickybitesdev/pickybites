import { View, Text, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { FoodJournalEntry } from "@/lib/foodJournal";
import { formatDate, cn } from "@/lib/utils";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { useAppStore } from "@/store/useAppStore";
import { lovesHeartLabel, bitesSegmentHint } from "@/lib/bites";

const VISIBILITY_ICON: Record<FoodJournalEntry["visibility"], keyof typeof Ionicons.glyphMap> = {
  private: "lock-closed-outline",
  friends: "people-outline",
  public: "globe-outline",
};

export function BitesJournalCard({
  entry,
  onFavoriteToggle,
}: {
  entry: FoodJournalEntry;
  onFavoriteToggle?: () => void;
}) {
  const colors = useThemedColors();
  const isFavorite = useAppStore((s) => s.isRestaurantFavorite(entry.restaurant_id));
  const toggleRestaurantFavorite = useAppStore((s) => s.toggleRestaurantFavorite);
  const deleteReview = useAppStore((s) => s.deleteReview);
  const image = entry.photos[0];

  const openDetail = () => {
    router.push(`/bite/${entry.review_id}`);
  };

  const toggleFavorite = async () => {
    await toggleRestaurantFavorite(entry.restaurant_id);
    onFavoriteToggle?.();
  };

  const openOverflow = () => {
    Alert.alert(entry.restaurant_name, undefined, [
      { text: "View details", onPress: openDetail },
      {
        text: "Edit",
        onPress: () => router.push(`/add-review?reviewId=${entry.review_id}`),
      },
      {
        text: isFavorite ? "Remove from Loves" : "Add to Loves",
        onPress: () => void toggleFavorite(),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert("Delete this Bite?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => void deleteReview(entry.review_id),
            },
          ]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <Pressable
      onPress={openDetail}
      className={cn("overflow-hidden rounded-2xl", ui.surface.card)}
      accessibilityRole="button"
      accessibilityLabel={`${entry.restaurant_name}, ${entry.rating_value} out of ${entry.rating_max}`}
    >
      <View className="flex-row">
        {image ? (
          <Image source={{ uri: image }} style={{ width: 96, height: 112 }} contentFit="cover" />
        ) : (
          <View className={cn("w-24 h-28 items-center justify-center", ui.surface.muted)}>
            <Ionicons name="restaurant-outline" size={22} color={colors.iconMuted} />
          </View>
        )}
        <View className="flex-1 p-3 gap-1.5">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1 gap-0.5">
              <Text className={`text-base font-semibold ${ui.text.primary}`} numberOfLines={1}>
                {entry.restaurant_name}
              </Text>
              <Text className={`text-xs ${ui.text.muted}`} numberOfLines={1}>
                {entry.cuisine}
                {entry.city ? ` · ${entry.city}` : ""}
                {` · ${formatDate(entry.visit_date)}`}
              </Text>
            </View>
            <Pressable onPress={openOverflow} hitSlop={8} accessibilityLabel="More actions">
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.iconMuted} />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-2">
            <Text className={`text-sm font-bold ${ui.text.primary}`}>
              {entry.rating_value}/{entry.rating_max}
            </Text>
            <Ionicons
              name={VISIBILITY_ICON[entry.visibility]}
              size={13}
              color={colors.iconMuted}
            />
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                void toggleFavorite();
              }}
              hitSlop={8}
              accessibilityLabel={lovesHeartLabel(isFavorite)}
              accessibilityHint={bitesSegmentHint("favorites")}
              className="ml-auto"
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={18}
                color={isFavorite ? colors.brand : colors.iconMuted}
              />
            </Pressable>
          </View>

          {entry.review_text ? (
            <Text className={`text-sm leading-5 ${ui.text.secondary}`} numberOfLines={2}>
              {entry.review_text}
            </Text>
          ) : null}

          {entry.dishes.length > 0 ? (
            <Text className={`text-xs ${ui.text.muted}`}>
              {entry.dishes.length} dish{entry.dishes.length === 1 ? "" : "es"}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
