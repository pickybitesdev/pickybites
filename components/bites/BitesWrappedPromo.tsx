import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { cn } from "@/lib/utils";

export function BitesWrappedPromo({ visible }: { visible: boolean }) {
  const colors = useThemedColors();
  if (!visible) return null;

  return (
    <Pressable
      onPress={() => router.push("/wrapped")}
      className={cn(
        "flex-row items-center gap-3 rounded-2xl px-4 py-3.5 border border-savr-200 dark:border-savr-700",
        "bg-savr-50 dark:bg-savr-900",
      )}
      accessibilityRole="button"
      accessibilityLabel="Open Food Wrapped"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-savr-500">
        <Ionicons name="sparkles" size={18} color="#fff" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className={`text-sm font-bold ${ui.text.primary}`}>Food Wrapped</Text>
        <Text className={`text-xs ${ui.text.muted}`}>See your year in bites</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} />
    </Pressable>
  );
}

/** Show Wrapped promo when the user has enough journal activity. */
export function shouldShowWrappedPromo(reviewCount: number): boolean {
  return reviewCount >= 3;
}
