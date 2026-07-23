import { View, Text } from "react-native";
import type { BucketListStats } from "@/lib/bucket-list";
import { monthlyStreakLabel } from "@/lib/bucket-list";
import { Card } from "@/components/ui/Card";
import { ui } from "@/constants/ui";

export function BucketListProgress({ stats }: { stats: BucketListStats }) {
  const streak = monthlyStreakLabel(stats.monthlyNewCount);

  return (
    <Card className="gap-4">
      <View className="flex-row items-end justify-between">
        <View>
          <Text className={`text-sm font-medium ${ui.text.muted}`}>Your food bucket list</Text>
          <Text className={`text-2xl font-bold mt-1 ${ui.text.primary}`}>
            {stats.saved} saved · {stats.visited} visited
          </Text>
        </View>
        <Text className="text-3xl font-bold text-savr-500 dark:text-savr-400">
          {stats.completionPercent}%
        </Text>
      </View>

      <View className={`h-2 rounded-full overflow-hidden ${ui.surface.track}`}>
        <View
          className="h-full rounded-full bg-savr-500 dark:bg-savr-400"
          style={{ width: `${Math.min(100, stats.completionPercent)}%` }}
        />
      </View>

      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        <Text className={`text-xs ${ui.text.secondary}`}>
          {stats.planned} planned
        </Text>
        <Text className={`text-xs ${ui.text.secondary}`}>
          {stats.completionPercent}% completion
        </Text>
        {streak ? (
          <Text className="text-xs font-semibold text-savr-500 dark:text-savr-400">
            {streak}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
