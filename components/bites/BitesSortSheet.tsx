import { Modal, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { BitesSegment } from "@/lib/bites";
import {
  FAVORITES_SORT_OPTIONS,
  JOURNAL_SORT_OPTIONS,
  LISTS_SORT_OPTIONS,
  WANT_SORT_OPTIONS,
} from "@/lib/bites-sort";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { cn } from "@/lib/utils";

function optionsForSegment(segment: BitesSegment) {
  if (segment === "journal") return JOURNAL_SORT_OPTIONS;
  if (segment === "want_to_try") return WANT_SORT_OPTIONS;
  if (segment === "favorites") return FAVORITES_SORT_OPTIONS;
  return LISTS_SORT_OPTIONS;
}

export function BitesSortSheet({
  visible,
  onClose,
  segment,
  value,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  segment: BitesSegment;
  value: string;
  onSelect: (value: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();
  const options = optionsForSegment(segment);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} accessibilityLabel="Dismiss sort" />
        <View
          className="bg-white dark:bg-savr-900 rounded-t-3xl"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-savr-200 dark:bg-savr-700" />
          </View>
          <View className="flex-row items-center justify-between px-5 pb-3">
            <Text className={`text-xl font-bold ${ui.text.primary}`}>Sort</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close sort">
              <Ionicons name="close" size={24} color={colors.iconMuted} />
            </Pressable>
          </View>

          <View className="px-5 pb-4 gap-1">
            {options.map((opt) => {
              const active = value === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => onSelect(opt.value)}
                  className={cn(
                    "flex-row items-center justify-between rounded-2xl px-4 py-3.5",
                    active ? "bg-savr-100 dark:bg-savr-800" : "",
                  )}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text className={cn("text-base font-medium", active ? "text-savr-600" : ui.text.primary)}>
                    {opt.label}
                  </Text>
                  {active ? <Ionicons name="checkmark" size={20} color={colors.brand} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
