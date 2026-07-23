import { View, Text } from "react-native";
import { Card } from "@/components/ui/Card";
import type { FoodJournalMonth } from "@/lib/foodJournal";
import { ui } from "@/constants/ui";
import { cn } from "@/lib/utils";

export function JournalMonthSummary({ month }: { month: FoodJournalMonth }) {
  return (
    <View className="gap-3">
      <Text className={`text-xl font-bold ${ui.text.primary}`}>{month.month}</Text>
      <Card className={cn("gap-2 p-4", ui.surface.inset)}>
        <Text className={`text-sm ${ui.text.secondary}`}>
          {month.total_visits} restaurant{month.total_visits === 1 ? "" : "s"} visited
        </Text>
        <Text className={`text-sm ${ui.text.secondary}`}>
          {month.unique_cuisines} cuisine{month.unique_cuisines === 1 ? "" : "s"} tried
        </Text>
        <Text className={`text-sm ${ui.text.secondary}`}>
          Average score: {month.average_rating.toFixed(1)}/10
        </Text>
        {month.top_meal ? (
          <Text className={`text-sm ${ui.text.secondary}`}>Top meal: {month.top_meal}</Text>
        ) : null}
      </Card>
    </View>
  );
}
