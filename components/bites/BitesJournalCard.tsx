import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { FoodJournalEntry } from "@/lib/foodJournal";
import { cn } from "@/lib/utils";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { useAppStore } from "@/store/useAppStore";
import { JournalEntryActionsSheet } from "@/components/bites/JournalEntryActionsSheet";

const VISIBILITY_ICON: Record<FoodJournalEntry["visibility"], keyof typeof Ionicons.glyphMap> = {
  private: "lock-closed-outline",
  friends: "people-outline",
  public: "globe-outline",
};

export function BitesJournalCard({ entry }: { entry: FoodJournalEntry }) {
  const colors = useThemedColors();
  const deleteReview = useAppStore((s) => s.deleteReview);
  const [menuOpen, setMenuOpen] = useState(false);
  const image = entry.photos[0];

  const subtitle = [entry.cuisine, entry.city].filter(Boolean).join(" · ");
  const sheetSubtitle = `${entry.rating_value}/${entry.rating_max}${subtitle ? ` · ${subtitle}` : ""}`;

  const openDetail = () => {
    router.push(`/bite/${entry.review_id}`);
  };

  return (
    <>
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
                {subtitle ? (
                  <Text className={`text-xs ${ui.text.muted}`} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => setMenuOpen(true)}
                hitSlop={8}
                accessibilityLabel="More actions"
                accessibilityRole="button"
              >
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

      <JournalEntryActionsSheet
        visible={menuOpen}
        restaurantName={entry.restaurant_name}
        subtitle={sheetSubtitle}
        onClose={() => setMenuOpen(false)}
        onViewDetails={openDetail}
        onEdit={() => router.push(`/add-review?reviewId=${entry.review_id}`)}
        onDelete={() => void deleteReview(entry.review_id)}
      />
    </>
  );
}
