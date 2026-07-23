import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  isValidIsoDate,
  planVisitPresets,
  type PlanVisitPresetId,
} from "@/lib/plan-visit";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { cn } from "@/lib/utils";

export function PlanVisitSheet({
  visible,
  placeName,
  initialDate,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  placeName: string;
  /** YYYY-MM-DD optional prefill */
  initialDate?: string | null;
  onClose: () => void;
  onConfirm: (opts: { dateIso: string; addToCalendar: boolean }) => void;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();
  const presets = planVisitPresets();
  const [presetId, setPresetId] = useState<PlanVisitPresetId | "custom">("tonight");
  const [customDate, setCustomDate] = useState(presets[0]?.date ?? "");
  const [addToCalendar, setAddToCalendar] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const presetsNow = planVisitPresets();
    if (initialDate && isValidIsoDate(initialDate)) {
      const match = presetsNow.find((p) => p.date === initialDate);
      if (match) {
        setPresetId(match.id);
        setCustomDate(match.date);
      } else {
        setPresetId("custom");
        setCustomDate(initialDate);
      }
    } else {
      setPresetId("tonight");
      setCustomDate(presetsNow[0]?.date ?? "");
    }
    setAddToCalendar(true);
  }, [visible, initialDate]);

  const selectedDate =
    presetId === "custom"
      ? customDate.trim()
      : presets.find((p) => p.id === presetId)?.date ?? customDate;

  const canSave = isValidIsoDate(selectedDate);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation?.()}
          className={`rounded-t-3xl px-4 pt-3 pb-2 ${ui.surface.card}`}
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="items-center mb-3">
            <View className="w-10 h-1 rounded-full bg-savr-200 dark:bg-savr-700" />
          </View>

          <View className="flex-row items-start justify-between gap-3 mb-1">
            <View className="flex-1 gap-1">
              <Text className={`text-xl font-bold ${ui.text.primary}`}>Plan your visit</Text>
              <Text className={`text-sm ${ui.text.muted}`} numberOfLines={2}>
                When are you going to {placeName}?
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.iconMuted} />
            </Pressable>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-4">
            {presets.map((preset) => {
              const active = presetId === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => {
                    setPresetId(preset.id);
                    setCustomDate(preset.date);
                  }}
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
            <Pressable
              onPress={() => setPresetId("custom")}
              className={cn(
                "px-3 py-2 rounded-full",
                presetId === "custom" ? "bg-savr-500" : ui.surface.muted,
              )}
            >
              <Text
                className={cn(
                  "text-sm font-medium",
                  presetId === "custom" ? "text-white" : ui.text.secondary,
                )}
              >
                Pick a date
              </Text>
            </Pressable>
          </View>

          {presetId === "custom" ? (
            <View className="mt-3">
              <Input
                label="Date"
                value={customDate}
                onChangeText={setCustomDate}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
              />
            </View>
          ) : null}

          <View className="flex-row items-center justify-between mt-5 py-2">
            <View className="flex-1 pr-3">
              <Text className={`text-sm font-semibold ${ui.text.primary}`}>Add to calendar</Text>
              <Text className={`text-xs mt-0.5 ${ui.text.muted}`}>
                Opens Google Calendar with an all-day event
              </Text>
            </View>
            <Switch
              value={addToCalendar}
              onValueChange={setAddToCalendar}
              trackColor={{ false: "#D4CFCB", true: "#FF8559" }}
            />
          </View>

          <View className="flex-row gap-3 mt-4">
            <Button label="Cancel" variant="secondary" className="flex-1" onPress={onClose} />
            <Button
              label="Save plan"
              className="flex-1"
              disabled={!canSave}
              onPress={() => {
                if (!canSave) return;
                onConfirm({ dateIso: selectedDate, addToCalendar });
              }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
