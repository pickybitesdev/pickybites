import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CountUpText } from "@/components/ui/CountUpText";
import { FadeInView } from "@/components/ui/FadeInView";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import type { MonthStats } from "@/lib/journal-stats";
import { ui } from "@/constants/ui";
import { cn } from "@/lib/utils";

function StatPill({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <Card className="flex-1 items-center py-4 px-2 gap-1">
      <CountUpText
        value={value}
        decimals={label === "Avg Rating" ? 1 : 0}
        suffix={suffix}
        className={`text-2xl font-bold ${ui.text.primary}`}
      />
      <Text className={`text-xs text-center ${ui.text.muted}`}>{label}</Text>
    </Card>
  );
}

export function FoodJournalSection({ stats }: { stats: MonthStats }) {
  return (
    <FadeInView className="gap-3 px-4">
      <View className="flex-row items-end justify-between">
        <HomeSectionHeader title="This Month" subtitle="Your food journal at a glance" icon="book" />
        <Pressable onPress={() => router.push("/journal")} hitSlop={8}>
          <Text className="text-sm font-semibold text-savr-350 dark:text-savr-400">Open journal</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-3">
        <StatPill label="Restaurants Visited" value={stats.restaurantsVisited} />
        <StatPill label="New Cuisines" value={stats.newCuisines} />
        <StatPill
          label="Avg Rating"
          value={stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}/10` : "—"}
        />
      </View>

      <Button label="View Food Journal" variant="secondary" onPress={() => router.push("/journal")} />
    </FadeInView>
  );
}

export function MonthlyRecapCard({ stats }: { stats: MonthStats }) {
  if (stats.restaurantsVisited === 0) return null;

  return (
    <FadeInView delay={80} className="px-4">
      <Card className={cn("gap-4 p-5", ui.accentCard)}>
        <View>
          <Text className={`text-xs font-semibold uppercase tracking-widest ${ui.text.muted}`}>Monthly recap</Text>
          <Text className={`text-2xl font-bold mt-1 ${ui.text.primary}`}>{stats.monthLabel}</Text>
        </View>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Ionicons name="restaurant-outline" size={18} color="#FF8559" />
            <Text className={`text-base ${ui.text.secondary}`}>
              {stats.restaurantsVisited} Restaurant{stats.restaurantsVisited === 1 ? "" : "s"}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="earth-outline" size={18} color="#FF8559" />
            <Text className={`text-base ${ui.text.secondary}`}>
              {stats.newCuisines} New Cuisine{stats.newCuisines === 1 ? "" : "s"}
            </Text>
          </View>
          {stats.topMeal && (
            <View className="flex-row items-center gap-2">
              <Ionicons name="trophy-outline" size={18} color="#FF8559" />
              <Text className={`text-base ${ui.text.secondary}`}>
                Top Meal: {stats.topMeal.name}
              </Text>
            </View>
          )}
        </View>

        <Button label="Relive Your Month" variant="ghost" onPress={() => router.push("/journal")} />
      </Card>
    </FadeInView>
  );
}

