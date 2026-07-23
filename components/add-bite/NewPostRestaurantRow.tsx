import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";

export function NewPostRestaurantRow({
  name,
  subtitle,
  onPress,
}: {
  name: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const selected = !!name.trim();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={selected ? `Restaurant ${name}` : "Tag a restaurant"}
      className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
      style={{
        borderColor: brandColors.border,
        backgroundColor: brandColors.surface,
      }}
    >
      <Ionicons name="location-outline" size={22} color={brandColors.primary} />
      <View className="flex-1">
        <Text
          className={`text-base font-semibold ${selected ? ui.text.primary : ui.text.secondary}`}
          numberOfLines={1}
        >
          {selected ? name : "Tag a restaurant"}
        </Text>
        {selected && subtitle ? (
          <Text className={`text-xs mt-0.5 ${ui.text.muted}`} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={brandColors.iconInactive} />
    </Pressable>
  );
}
