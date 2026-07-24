import { Text } from "react-native";
import type { FoodJournalMonth } from "@/lib/foodJournal";
import { ui } from "@/constants/ui";

/** Month divider for the Bites journal list. */
export function JournalMonthSummary({ month }: { month: FoodJournalMonth }) {
  return (
    <Text className={`text-lg font-bold ${ui.text.primary}`}>{month.month}</Text>
  );
}
