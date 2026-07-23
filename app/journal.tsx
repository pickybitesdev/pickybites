import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";

/** Deep link → Bites Journal. */
export default function JournalRedirect() {
  const colors = useThemedColors();

  useEffect(() => {
    router.replace({ pathname: "/(tabs)/bites", params: { segment: "journal" } });
  }, []);

  return (
    <View className={`flex-1 items-center justify-center ${ui.screen}`}>
      <ActivityIndicator color={colors.spinner} />
    </View>
  );
}
