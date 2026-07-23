import { View, Text, Pressable } from "react-native";
import { Input } from "@/components/ui/Input";
import { ui } from "@/constants/ui";
import { cn } from "@/lib/utils";

function toIsoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toIsoDate(d);
}

const PRESETS = [
  { label: "Today", value: () => toIsoDate(new Date()) },
  { label: "Yesterday", value: () => daysAgo(1) },
  { label: "2 days ago", value: () => daysAgo(2) },
  { label: "Last week", value: () => daysAgo(7) },
] as const;

export function VisitDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (isoDate: string) => void;
}) {
  return (
    <View className="gap-2">
      <Text className={`text-sm font-medium ${ui.text.secondary}`}>When did you visit?</Text>
      <View className="flex-row flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const iso = preset.value();
          const active = value === iso;
          return (
            <Pressable
              key={preset.label}
              onPress={() => onChange(iso)}
              className={cn(
                "px-3 py-2 rounded-full",
                active ? "bg-savr-500" : ui.surface.muted,
              )}
            >
              <Text className={cn("text-sm font-medium", active ? "text-white" : ui.text.secondary)}>
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Input
        label="Or pick a date"
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
      />
    </View>
  );
}

