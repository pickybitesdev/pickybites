import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FeedScopeToggle } from "@/components/feed/FeedScopeToggle";
import type { FeedScope } from "@/lib/feed/types";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { brandColors } from "@/constants/branding";

export function FeedHeader({
  scope,
  onScopeChange,
  onCustomize,
  showScopeToggle = false,
  activeFilterCount = 0,
  compact = false,
}: {
  scope: FeedScope;
  onScopeChange: (scope: FeedScope) => void;
  onCustomize: () => void;
  /** For You was removed — Feed is friends activity only. */
  showScopeToggle?: boolean;
  /** Badge when Customize Feed has active filters. */
  activeFilterCount?: number;
  /** Slightly tighter header for returning users. */
  compact?: boolean;
}) {
  const colors = useThemedColors();
  const subtitle = "Recent activity from people you follow";
  const customizeLabel =
    activeFilterCount > 0
      ? `Customize Feed, ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active`
      : "Customize Feed";

  return (
    <View className={`px-4 pt-2 ${compact ? "pb-0.5 gap-2" : "pb-1 gap-3"}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className={`${compact ? "text-2xl" : "text-3xl"} font-bold ${ui.text.primary}`}>
            Feed
          </Text>
          {!compact ? (
            <Text className={`text-sm ${ui.text.secondary}`}>{subtitle}</Text>
          ) : (
            <Text className={`text-xs ${ui.text.muted}`} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <Pressable
          onPress={onCustomize}
          accessibilityRole="button"
          accessibilityLabel={customizeLabel}
          hitSlop={8}
          testID="feed-customize-button"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: brandColors.surface,
            borderWidth: 1,
            borderColor: brandColors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="options-outline" size={22} color={colors.brand} />
          {activeFilterCount > 0 ? (
            <View
              testID="feed-customize-badge"
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: brandColors.primary,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 4,
              }}
            >
              <Text className="text-[10px] font-bold text-white">{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      {showScopeToggle ? <FeedScopeToggle scope={scope} onChange={onScopeChange} /> : null}
    </View>
  );
}
