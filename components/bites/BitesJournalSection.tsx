import { View } from "react-native";
import { router } from "expo-router";
import { JournalMonthSummary } from "@/components/journal/JournalMonthSummary";
import { BitesJournalCard } from "@/components/bites/BitesJournalCard";
import { BitesStatsRow } from "@/components/bites/BitesStatsRow";
// Food Wrapped ships later — restore promo when the feature launches
// import { BitesWrappedPromo, shouldShowWrappedPromo } from "@/components/bites/BitesWrappedPromo";
import { EmptyState } from "@/components/ui/EmptyState";
import type { FoodJournalMonth, FoodJournalStats } from "@/lib/foodJournal";

export function BitesJournalSection({
  months,
  stats,
  reviewCount: _reviewCount,
  isEmpty,
  isFilterEmpty,
  hasSearch,
  emptyMessage,
}: {
  months: FoodJournalMonth[];
  stats: FoodJournalStats;
  reviewCount: number;
  isEmpty: boolean;
  isFilterEmpty: boolean;
  hasSearch: boolean;
  emptyMessage: string;
}) {
  if (isEmpty) {
    return (
      <EmptyState
        icon="book-outline"
        title="No food memories yet"
        description={emptyMessage}
        actionLabel="Add a Bite"
        onAction={() => router.push("/add-bite")}
      />
    );
  }

  if (isFilterEmpty) {
    return (
      <EmptyState
        icon={hasSearch ? "search-outline" : "filter-outline"}
        title={hasSearch ? "No matches" : "No bites match these filters"}
        description={
          hasSearch
            ? "Try a different search term."
            : "Clear filters to see your full journal."
        }
      />
    );
  }

  return (
    <View className="gap-5">
      <BitesStatsRow stats={stats} />
      {/* Food Wrapped ships later — restore when the feature launches
      <BitesWrappedPromo visible={shouldShowWrappedPromo(_reviewCount)} />
      */}
      {months.map((month) => (
        <View key={month.month_key} className="gap-3">
          <JournalMonthSummary month={month} />
          {month.entries.map((entry) => (
            <BitesJournalCard key={entry.review_id} entry={entry} />
          ))}
        </View>
      ))}
    </View>
  );
}
