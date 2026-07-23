import { View, TextInput, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { cn } from "@/lib/utils";

export function BitesSearchBar({
  value,
  onChangeText,
  filterCount,
  onOpenFilters,
  onOpenSort,
}: {
  value: string;
  onChangeText: (text: string) => void;
  filterCount: number;
  onOpenFilters: () => void;
  onOpenSort: () => void;
}) {
  const colors = useThemedColors();

  return (
    <View className="gap-3">
      <View
        className={cn(
          "flex-row items-center gap-2 rounded-2xl px-3 py-2.5",
          ui.surface.inset,
        )}
      >
        <Ionicons name="search" size={18} color={colors.iconMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search your Bites"
          placeholderTextColor={colors.placeholder}
          className={`flex-1 text-base ${ui.text.primary}`}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Search your Bites"
        />
        {value ? (
          <Pressable onPress={() => onChangeText("")} hitSlop={8} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.iconMuted} />
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={onOpenFilters}
          className={cn(
            "flex-row items-center gap-1.5 rounded-full px-3.5 py-2",
            filterCount > 0 ? "bg-savr-500" : ui.surface.card,
          )}
          accessibilityLabel={
            filterCount > 0 ? `Filters, ${filterCount} active` : "Open filters"
          }
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={filterCount > 0 ? "#fff" : colors.icon}
          />
          <Text
            className={cn(
              "text-sm font-semibold",
              filterCount > 0 ? "text-white" : ui.text.secondary,
            )}
          >
            {filterCount > 0 ? `Filters (${filterCount})` : "Filters"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onOpenSort}
          className={cn("flex-row items-center gap-1.5 rounded-full px-3.5 py-2", ui.surface.card)}
          accessibilityLabel="Open sort options"
        >
          <Ionicons name="swap-vertical-outline" size={16} color={colors.icon} />
          <Text className={`text-sm font-semibold ${ui.text.secondary}`}>Sort</Text>
        </Pressable>
      </View>
    </View>
  );
}
