import { View, Text } from "react-native";
import { ui } from "@/constants/ui";

export function FeedEndState() {
  return (
    <View className="py-6 items-center px-4" testID="feed-end-state">
      <Text className={`text-sm ${ui.text.muted}`}>You’re all caught up</Text>
    </View>
  );
}
