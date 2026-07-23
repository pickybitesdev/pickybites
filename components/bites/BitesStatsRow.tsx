import { View, Text } from "react-native";
// Food Wrapped ships later — restore tap-through when the feature launches
// import { router } from "expo-router";
import type { FoodJournalStats } from "@/lib/foodJournal";
import { ui } from "@/constants/ui";
import { cn } from "@/lib/utils";

function StatCell({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View className="flex-1 items-center gap-0.5 py-2">
      <Text className={`text-lg font-bold ${ui.text.primary}`}>{value}</Text>
      <Text className={`text-[11px] ${ui.text.muted}`} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function BitesStatsRow({ stats }: { stats: FoodJournalStats }) {
  return (
    <View className={cn("flex-row rounded-2xl px-1 py-1", ui.surface.inset)}>
      <StatCell label="Restaurants" value={stats.restaurantsVisited} />
      <StatCell label="Cuisines" value={stats.cuisinesTried} />
      {/* Food Wrapped ships later — restore: onPress={() => router.push("/wrapped")} */}
      <StatCell
        label="Avg score"
        value={stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}/10` : "—"}
      />
      <StatCell label="Cities" value={stats.cities} />
    </View>
  );
}
