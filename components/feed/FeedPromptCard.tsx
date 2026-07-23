import { View, Text } from "react-native";
import { router } from "expo-router";
import type { FeedPromptItem } from "@/lib/feed/types";
import { Button } from "@/components/ui/Button";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";

export function FeedPromptCard({ item }: { item: FeedPromptItem }) {
  const runPrimary = () => {
    switch (item.kind) {
      case "find_friends":
        router.push("/friends");
        break;
      case "complete_taste_dna":
        router.push("/taste-quiz");
        break;
      case "review_restaurant":
        router.push("/add-bite");
        break;
      case "save_to_bites":
      case "discover_restaurants":
        router.push("/(tabs)/discover");
        break;
    }
  };

  const runSecondary = () => {
    if (item.kind === "find_friends") router.push("/(tabs)/discover");
  };

  return (
    <View
      testID="feed-prompt-card"
      className="mx-4 rounded-2xl p-4 gap-3 border"
      style={{
        backgroundColor: brandColors.primaryLight,
        borderColor: brandColors.border,
      }}
    >
      <Text className={`text-base font-bold ${ui.text.primary}`}>{item.title}</Text>
      <Text className={`text-sm leading-5 ${ui.text.secondary}`}>{item.body}</Text>
      <View className="flex-row gap-2">
        <Button label={item.primaryActionLabel} onPress={runPrimary} className="flex-1" />
        {item.secondaryActionLabel ? (
          <Button
            label={item.secondaryActionLabel}
            variant="secondary"
            onPress={runSecondary}
            className="flex-1"
          />
        ) : null}
      </View>
    </View>
  );
}
