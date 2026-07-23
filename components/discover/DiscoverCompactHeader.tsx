import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { APP_NAME_PICKY, APP_NAME_BITES } from "@/constants/branding";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";

export function DiscoverCompactHeader({
  onSurpriseMe,
  surpriseDisabled,
}: {
  onSurpriseMe: () => void;
  surpriseDisabled?: boolean;
}) {
  const colors = useThemedColors();

  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="text-xl font-bold">
        <Text className={ui.text.primary}>{APP_NAME_PICKY}</Text>
        <Text className="text-savr-500">{APP_NAME_BITES}</Text>
      </Text>
      <Pressable
        onPress={onSurpriseMe}
        disabled={surpriseDisabled}
        accessibilityRole="button"
        accessibilityLabel="Surprise Me"
        className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 ${
          surpriseDisabled ? "opacity-40" : ""
        } bg-savr-100 dark:bg-savr-800`}
        hitSlop={6}
      >
        <Ionicons name="shuffle" size={16} color={colors.brand} />
        <Text className={`text-sm font-semibold ${ui.text.secondary}`}>Surprise Me</Text>
      </Pressable>
    </View>
  );
}
