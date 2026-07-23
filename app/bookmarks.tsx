import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";

/** Legacy bookmarks route → Bites Try Next. */
export default function BookmarksRedirect() {
  const colors = useThemedColors();

  useEffect(() => {
    router.replace({ pathname: "/(tabs)/bites", params: { segment: "want_to_try" } });
  }, []);

  return (
    <View className={`flex-1 items-center justify-center ${ui.screen}`}>
      <ActivityIndicator color={colors.spinner} />
    </View>
  );
}
