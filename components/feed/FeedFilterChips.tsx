import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { summarizeFeedFilters, type FeedPreferences } from "@/lib/feed-preferences";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";

export function FeedFilterChips({
  prefs,
  onClear,
  onPressChip,
}: {
  prefs: FeedPreferences;
  onClear: () => void;
  onPressChip?: () => void;
}) {
  const chips = summarizeFeedFilters(prefs);
  if (chips.length === 0) return null;

  return (
    <View className="px-4 pb-1" testID="feed-filter-chips">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 items-center"
      >
        {chips.map((chip) => (
          <Pressable
            key={chip}
            onPress={onPressChip}
            accessibilityRole="button"
            accessibilityLabel={`Filter: ${chip}. Open Customize Feed`}
            className="rounded-full px-3 py-1.5 border border-savr-200 dark:border-savr-700 bg-savr-50 dark:bg-savr-800"
          >
            <Text className={`text-xs font-semibold ${ui.text.secondary}`}>{chip}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Clear all feed filters"
          hitSlop={8}
          className="flex-row items-center gap-1 rounded-full px-3 py-1.5"
          testID="feed-clear-filters"
        >
          <Ionicons name="close-circle" size={16} color={brandColors.primary} />
          <Text style={{ color: brandColors.primary }} className="text-xs font-semibold">
            Clear
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
