import { View, Text } from "react-native";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";

export function AddBiteProgress({ step, total }: { step: number; total: number }) {
  const clamped = Math.min(Math.max(step, 1), total);
  const ratio = clamped / total;

  return (
    <View className="gap-2">
      <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
        Step {clamped} of {total}
      </Text>
      <View
        className="h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: brandColors.border }}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: clamped }}
      >
        <View
          style={{
            width: `${ratio * 100}%`,
            height: "100%",
            backgroundColor: brandColors.primary,
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}
