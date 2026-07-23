import { View, Text, Pressable } from "react-native";
import { cn } from "@/lib/utils";
import { ui } from "@/constants/ui";
import { hapticSelection } from "@/lib/haptics";

type SegmentOption<T extends string> = { value: T; label: string };

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "surface",
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "brand" | "surface";
  className?: string;
}) {
  if (variant === "brand") {
    return (
      <View className={cn("flex-row gap-2", className)}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                hapticSelection();
                onChange(opt.value);
              }}
              className={cn(
                "flex-1 py-2.5 rounded-xl items-center",
                active ? "bg-savr-500" : ui.surface.card
              )}
            >
              <Text className={cn("font-semibold", active ? "text-white" : ui.text.secondary)}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View className={cn("flex-row gap-1 p-1 rounded-2xl", ui.surface.segment, className)}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              hapticSelection();
              onChange(opt.value);
            }}
            className={cn(
              "flex-1 py-2.5 rounded-xl items-center",
              active && ui.surface.elevated
            )}
          >
            <Text className={cn("font-semibold capitalize", active ? ui.text.primary : ui.text.muted)}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

