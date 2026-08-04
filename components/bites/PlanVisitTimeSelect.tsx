import { useState } from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatVisitTimeLabel } from "@/lib/plan-visit";
import type { VisitTimeSlot } from "@/lib/restaurant-hours";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { cn } from "@/lib/utils";

export function PlanVisitTimeSelect({
  slots,
  value,
  onChange,
  disabled,
}: {
  slots: VisitTimeSlot[];
  value: string;
  onChange: (timeHhmm: string) => void;
  disabled?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();
  const [open, setOpen] = useState(false);
  const label =
    slots.find((s) => s.value === value)?.label ??
    (value ? formatVisitTimeLabel(value) : "Select a time");

  return (
    <>
      <Pressable
        disabled={disabled || slots.length === 0}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Select visit time"
        accessibilityState={{ disabled: disabled || slots.length === 0 }}
        className={cn(
          "flex-row items-center justify-between rounded-2xl border px-4 py-3.5 mt-2",
          ui.surface.inset,
          (disabled || slots.length === 0) && "opacity-45",
        )}
      >
        <Text className={`text-base font-medium ${ui.text.primary}`}>{label}</Text>
        <Ionicons name="chevron-down" size={20} color={colors.iconMuted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end">
          <Pressable className="absolute inset-0 bg-black/40" onPress={() => setOpen(false)} />
          <View
            className={`rounded-t-3xl max-h-[55%] ${ui.surface.card}`}
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="items-center pt-3 pb-2">
              <View className="w-10 h-1 rounded-full bg-savr-200 dark:bg-savr-700" />
            </View>
            <Text className={`text-lg font-bold px-4 pb-3 ${ui.text.primary}`}>Pick a time</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {slots.map((slot) => {
                const active = slot.value === value;
                return (
                  <Pressable
                    key={slot.value}
                    onPress={() => {
                      onChange(slot.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex-row items-center justify-between px-4 py-3.5 border-b border-savr-100 dark:border-savr-800",
                      active && "bg-savr-50 dark:bg-savr-850",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-base",
                        active ? "font-semibold text-savr-600 dark:text-savr-500" : ui.text.primary,
                      )}
                    >
                      {slot.label}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark" size={22} color={colors.brand} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
