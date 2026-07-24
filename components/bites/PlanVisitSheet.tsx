import { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, Pressable, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  DEFAULT_VISIT_TIME,
  isValidIsoDate,
  planVisitPresets,
  type PlanVisitPresetId,
} from "@/lib/plan-visit";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { cn } from "@/lib/utils";
import { sharePlannedVisit } from "@/lib/share";
import { hapticLight } from "@/lib/haptics";
import { fetchRestaurantOpeningPeriods } from "@/lib/places/google";
import { PlanVisitTimeSelect } from "@/components/bites/PlanVisitTimeSelect";
import {
  isVisitDateOpen,
  pickDefaultVisitTime,
  visitTimeFromPlannedAt,
  visitTimesOpenOnDate,
  type OpeningPeriod,
} from "@/lib/restaurant-hours";

export function PlanVisitSheet({
  visible,
  placeName,
  initialDate,
  initialPlannedAt,
  cuisine,
  city,
  address,
  restaurantId,
  googlePlaceId,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  placeName: string;
  /** YYYY-MM-DD optional prefill */
  initialDate?: string | null;
  /** Full plannedAt ISO to restore date + time when editing */
  initialPlannedAt?: string | null;
  cuisine?: string | null;
  city?: string | null;
  address?: string | null;
  restaurantId?: string | null;
  googlePlaceId?: string | null;
  onClose: () => void;
  onConfirm: (opts: { dateIso: string; timeHhmm: string; addToCalendar: boolean }) => void;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();
  const presets = planVisitPresets();
  const [presetId, setPresetId] = useState<PlanVisitPresetId | "custom">("tonight");
  const [customDate, setCustomDate] = useState(presets[0]?.date ?? "");
  const [visitTime, setVisitTime] = useState(DEFAULT_VISIT_TIME);
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [openingPeriods, setOpeningPeriods] = useState<OpeningPeriod[] | null>(null);
  const [hoursLoading, setHoursLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setOpeningPeriods(null);
      return;
    }
    let cancelled = false;
    setHoursLoading(true);
    void fetchRestaurantOpeningPeriods(googlePlaceId).then((periods) => {
      if (cancelled) return;
      setOpeningPeriods(periods);
      setHoursLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, googlePlaceId]);

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
    const dateForTime =
      initialDate && isValidIsoDate(initialDate)
        ? initialDate
        : presetsNow[0]?.date ?? "";
    const restored =
      initialPlannedAt && isValidIsoDate(dateForTime)
        ? visitTimeFromPlannedAt(initialPlannedAt, dateForTime, null)
        : null;
    setVisitTime(restored ?? DEFAULT_VISIT_TIME);
    setAddToCalendar(true);
  }, [visible, initialDate, initialPlannedAt]);

  useEffect(() => {
    if (!visible || hoursLoading) return;
    const presetsNow = planVisitPresets();
    const selected =
      presetId === "custom"
        ? customDate.trim()
        : presetsNow.find((p) => p.id === presetId)?.date ?? "";

    if (isValidIsoDate(selected) && isVisitDateOpen(selected, openingPeriods)) return;

    const openPreset = presetsNow.find((p) => isVisitDateOpen(p.date, openingPeriods));
    if (openPreset) {
      setPresetId(openPreset.id);
      setCustomDate(openPreset.date);
    } else if (presetId !== "custom") {
      setPresetId("custom");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- presetId/customDate read once per hours update
  }, [visible, hoursLoading, openingPeriods]);

  const selectedDate =
    presetId === "custom"
      ? customDate.trim()
      : presets.find((p) => p.id === presetId)?.date ?? customDate;

  const availableTimes = useMemo(() => {
    if (!isValidIsoDate(selectedDate)) return [];
    return visitTimesOpenOnDate(selectedDate, openingPeriods);
  }, [selectedDate, openingPeriods]);

  useEffect(() => {
    if (!visible || !isValidIsoDate(selectedDate)) return;
    setVisitTime(
      (current) => pickDefaultVisitTime(selectedDate, openingPeriods, current) ?? DEFAULT_VISIT_TIME,
    );
  }, [visible, selectedDate, openingPeriods]);

  const timeIsOpen =
    availableTimes.length > 0 && availableTimes.some((s) => s.value === visitTime);
  const canSave = isValidIsoDate(selectedDate) && timeIsOpen;

  const hoursHint = hoursLoading
    ? "Checking when they're open…"
    : openingPeriods === null
      ? "Hours unavailable — showing times until 10 PM"
      : availableTimes.length === 0
        ? "Looks closed on this day — try another date"
        : "Every 30 min while they're open";

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
              const closed = !hoursLoading && !isVisitDateOpen(preset.date, openingPeriods);
              return (
                <Pressable
                  key={preset.id}
                  disabled={closed}
                  onPress={() => {
                    if (closed) return;
                    setPresetId(preset.id);
                    setCustomDate(preset.date);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled: closed }}
                  accessibilityLabel={
                    closed ? `${preset.label}, closed` : preset.label
                  }
                  className={cn(
                    "px-3 py-2 rounded-full",
                    closed ? "opacity-45 bg-savr-100 dark:bg-savr-850" : active ? "bg-savr-500" : ui.surface.muted,
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-medium",
                      closed
                        ? "text-savr-400 dark:text-savr-500 line-through"
                        : active
                          ? "text-white"
                          : ui.text.secondary,
                    )}
                  >
                    {preset.label}
                    {closed ? " · Closed" : ""}
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

          <Text className={`text-sm font-semibold mt-5 ${ui.text.primary}`}>What time?</Text>
          <Text className={`text-xs mt-1 ${ui.text.muted}`}>{hoursHint}</Text>
          <PlanVisitTimeSelect
            slots={availableTimes}
            value={visitTime}
            onChange={setVisitTime}
            disabled={!canSave && availableTimes.length === 0}
          />

          <View className="flex-row items-center justify-between mt-5 py-2">
            <View className="flex-1 pr-3">
              <Text className={`text-sm font-semibold ${ui.text.primary}`}>Add to calendar</Text>
              <Text className={`text-xs mt-0.5 ${ui.text.muted}`}>
                Opens Google Calendar at your chosen time
              </Text>
            </View>
            <Switch
              value={addToCalendar}
              onValueChange={setAddToCalendar}
              trackColor={{ false: "#D4CFCB", true: "#FF8559" }}
            />
          </View>

          <Pressable
            disabled={!canSave}
            onPress={() => {
              if (!canSave) return;
              hapticLight();
              void sharePlannedVisit({
                placeName,
                dateIso: selectedDate,
                timeHhmm: visitTime,
                cuisine,
                city,
                address,
                restaurantId,
              });
            }}
            accessibilityRole="button"
            accessibilityLabel="Share plan with a friend"
            className={cn(
              "flex-row items-center justify-center gap-2 rounded-2xl py-3.5 mt-4 border border-savr-500 dark:border-savr-500",
              !canSave && "opacity-40",
            )}
          >
            <Ionicons name="share-outline" size={20} color={colors.primary} />
            <View className="items-center">
              <Text className="text-base font-semibold text-savr-500 dark:text-savr-500">
                Share plan
              </Text>
              <Text className={`text-xs ${ui.text.muted}`}>Send to a friend or your date</Text>
            </View>
          </Pressable>

          <View className="flex-row gap-3 mt-3">
            <Button label="Cancel" variant="secondary" className="flex-1" onPress={onClose} />
            <Button
              label="Save plan"
              className="flex-1"
              disabled={!canSave}
              onPress={() => {
                if (!canSave) return;
                onConfirm({ dateIso: selectedDate, timeHhmm: visitTime, addToCalendar });
              }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
