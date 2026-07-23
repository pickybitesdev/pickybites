import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";

export function BitesHeader({
  showMapToggle,
  mapMode,
  onToggleMap,
}: {
  showMapToggle: boolean;
  mapMode: boolean;
  onToggleMap: () => void;
}) {
  const colors = useThemedColors();

  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1 gap-1">
        <Text className={`text-3xl font-bold ${ui.text.primary}`}>Bites</Text>
        <Text className={`text-sm ${ui.text.muted}`}>Your food journal</Text>
      </View>
      {showMapToggle ? (
        <Pressable
          onPress={onToggleMap}
          accessibilityRole="button"
          accessibilityLabel={mapMode ? "Show timeline" : "Show map"}
          className="h-10 w-10 items-center justify-center rounded-full bg-savr-100 dark:bg-savr-800"
        >
          <Ionicons
            name={mapMode ? "list-outline" : "map-outline"}
            size={20}
            color={colors.icon}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
