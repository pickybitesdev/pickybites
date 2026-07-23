import { View, Text } from "react-native";
import { ui } from "@/constants/ui";
import { cn } from "@/lib/utils";

export function StepProgress({ step, total, labels }: { step: number; total: number; labels: string[] }) {
  return (
    <View className="gap-3">
      <View className="flex-row justify-between items-center">
        <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
          Step {step} of {total}
        </Text>
        <Text className={`text-xs ${ui.text.secondary}`}>{labels[step - 1]}</Text>
      </View>
      <View className="flex-row gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            className={cn("h-1.5 flex-1 rounded-full", i < step ? "bg-savr-500" : ui.surface.track)}
          />
        ))}
      </View>
    </View>
  );
}

