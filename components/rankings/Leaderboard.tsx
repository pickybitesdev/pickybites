import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { LeaderboardEntry } from "@/lib/rankings";
import { Card } from "@/components/ui/Card";
import { formatDate, cn } from "@/lib/utils";
import { ui } from "@/constants/ui";

const PODIUM = ["#D4A017", "#9CA3AF", "#CD7F32"] as const;

export function LeaderboardHeader() {
  return (
    <View className={cn("flex-row items-center px-3 py-2 rounded-xl", ui.surface.muted)}>
      <Text className={`w-10 text-[10px] font-bold uppercase ${ui.text.muted}`}>Rank</Text>
      <Text className={`flex-1 text-[10px] font-bold uppercase ${ui.text.muted}`}>Restaurant</Text>
      <Text className={`w-14 text-[10px] font-bold uppercase text-right ${ui.text.muted}`}>Score</Text>
      <Text className={`w-[72px] text-[10px] font-bold uppercase text-right ${ui.text.muted}`}>Last Visit</Text>
    </View>
  );
}

export function LeaderboardRow({
  entry,
  onPress,
}: {
  entry: LeaderboardEntry;
  onPress: () => void;
}) {
  const isPodium = entry.rank <= 3;
  const accent = isPodium ? PODIUM[entry.rank - 1] : undefined;

  return (
    <Pressable onPress={onPress}>
      <Card
        className={cn("p-0 overflow-hidden", isPodium && "border")}
        style={isPodium ? { borderColor: `${accent}66` } : undefined}
      >
        <View className="flex-row items-center px-3 py-3.5 min-h-[56px]">
          <View className="w-10 flex-row items-center gap-0.5">
            <Text className="text-lg font-black" style={{ color: accent ?? "#FF8559" }}>
              {entry.rank}
            </Text>
            {isPodium ? <Ionicons name="trophy" size={12} color={accent} /> : null}
          </View>

          <View className="flex-1 pr-2 gap-0.5">
            <Text className={`text-sm font-semibold ${ui.text.primary}`} numberOfLines={1}>
              {entry.restaurant_name}
            </Text>
            <Text className={`text-[11px] ${ui.text.muted}`} numberOfLines={1}>
              {entry.cuisine}
              {entry.review_count > 1 ? ` · ${entry.review_count} visits` : ""}
            </Text>
          </View>

          <Text className={`w-14 text-base font-black text-right ${ui.text.primary}`}>
            {entry.average_score.toFixed(1)}
          </Text>

          <Text className={`w-[72px] text-[11px] text-right ${ui.text.muted}`} numberOfLines={1}>
            {formatDate(entry.last_visit_date)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function LeaderboardPodium({
  entries,
  onPress,
}: {
  entries: LeaderboardEntry[];
  onPress: (entry: LeaderboardEntry) => void;
}) {
  const top = entries.slice(0, 3);
  if (top.length === 0) return null;

  const order = top.length >= 3 ? [top[1], top[0], top[2]] : top;

  return (
    <View className="flex-row items-end justify-center gap-2 py-2">
      {order.map((entry) => {
        const isFirst = entry.rank === 1;
        const accent = PODIUM[entry.rank - 1];
        return (
          <Pressable
            key={entry.restaurant_id}
            onPress={() => onPress(entry)}
            className="flex-1 items-center"
          >
            <View
              className={cn("w-full rounded-2xl items-center px-2 pt-3 pb-4 gap-1", ui.accentCard)}
              style={{
                minHeight: isFirst ? 132 : 112,
                borderWidth: 2,
                borderColor: `${accent}55`,
              }}
            >
              <Ionicons name="trophy" size={isFirst ? 22 : 18} color={accent} />
              <Text className="text-2xl font-black" style={{ color: accent }}>
                #{entry.rank}
              </Text>
              <Text className={`text-xs font-semibold text-center ${ui.text.primary}`} numberOfLines={2}>
                {entry.restaurant_name}
              </Text>
              <Text className={`text-sm font-black ${ui.text.primary}`}>{entry.average_score.toFixed(1)}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
