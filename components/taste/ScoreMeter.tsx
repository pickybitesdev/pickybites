import { View, Text } from "react-native";
import { CountUpText } from "@/components/ui/CountUpText";
import { formatScoreMetric } from "@/lib/taste-personality";
import { ui } from "@/constants/ui";

export function ScoreMeter({
  label,
  score,
  reviewCount,
  accent = "#FF8559",
  kind = "generic",
}: {
  label: string;
  score: number;
  reviewCount: number;
  accent?: string;
  kind?: "adventure" | "hidden-gem" | "generic";
}) {
  const display = formatScoreMetric(score, reviewCount, kind);
  const showBar = reviewCount >= 3 && score > 0;

  return (
    <View className="gap-2">
      <View className="flex-row justify-between items-end">
        <Text className={`text-sm font-medium ${ui.text.secondary}`}>{label}</Text>
        {showBar ? (
          <CountUpText value={score} className="text-2xl font-bold" style={{ color: accent }} />
        ) : (
          <Text className="text-base font-semibold" style={{ color: accent }}>
            {display}
          </Text>
        )}
      </View>
      {showBar && (
        <View className={`h-3 rounded-full overflow-hidden ${ui.surface.track}`}>
          <View className="h-full rounded-full" style={{ width: `${Math.min(100, score)}%`, backgroundColor: accent }} />
        </View>
      )}
    </View>
  );
}

