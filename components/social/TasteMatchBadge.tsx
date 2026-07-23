import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ui } from "@/constants/ui";
import { cn } from "@/lib/utils";

export function TasteMatchBadge({
  percent,
  detail,
  explanations = [],
  size = "md",
}: {
  percent: number;
  detail?: string;
  explanations?: string[];
  size?: "sm" | "md" | "lg";
}) {
  if (percent <= 0) return null;

  const color =
    percent >= 80 ? "bg-emerald-100 dark:bg-emerald-900/40" :
    percent >= 60 ? "bg-savr-100 dark:bg-savr-800" :
    "bg-amber-100 dark:bg-amber-900/40";

  const textColor =
    percent >= 80 ? "text-emerald-800 dark:text-emerald-200" :
    percent >= 60 ? "text-savr-500 dark:text-savr-200" :
    "text-amber-800 dark:text-amber-200";

  const percentSize = size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-base";
  const labelSize = size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-xs";
  const showExplanations = size !== "sm" && explanations.length > 0;

  return (
    <View className={cn(color, "px-4 py-3 rounded-2xl gap-2", size === "lg" ? "items-center" : "")}>
      <View className="flex-row items-center gap-2">
        <Ionicons
          name="heart"
          size={size === "lg" ? 20 : 16}
          color={percent >= 80 ? "#2FA866" : percent >= 60 ? "#FF8559" : "#E9A23B"}
        />
        <View className="flex-row items-baseline gap-1.5">
          <Text className={cn(percentSize, "font-black", textColor)}>{percent}%</Text>
          <Text className={cn(labelSize, "font-semibold", textColor)}>Taste Match</Text>
        </View>
      </View>

      {showExplanations ? (
        <View className={cn("gap-1", size === "lg" ? "items-center" : "")}>
          {explanations.map((line) => (
            <Text
              key={line}
              className={cn("text-xs leading-5", textColor, "opacity-90", size === "lg" && "text-center")}
            >
              {line}
            </Text>
          ))}
        </View>
      ) : detail ? (
        <Text className={cn("text-xs", textColor, "opacity-80")}>{detail}</Text>
      ) : null}
    </View>
  );
}
