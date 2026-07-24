import { View } from "react-native";
import { router } from "expo-router";
import { BitesJournalCard } from "@/components/bites/BitesJournalCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { FoodJournalEntry } from "@/lib/foodJournal";

export function BitesJournalSection({
  entries,
  isEmpty,
  isFilterEmpty,
  hasSearch,
  emptyMessage,
}: {
  entries: FoodJournalEntry[];
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
    <View className="gap-3">
      {entries.map((entry) => (
        <BitesJournalCard key={entry.review_id} entry={entry} />
      ))}
    </View>
  );
}
