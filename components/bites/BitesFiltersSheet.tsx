import { Modal, View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import type { BitesSegment } from "@/lib/bites";
import type { BitesFilterState } from "@/lib/bites-filters";
import type { ReviewVisibility } from "@/lib/types";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";

const VISIBILITY_OPTIONS: { value: ReviewVisibility; label: string }[] = [
  { value: "private", label: "Private" },
  { value: "friends", label: "Friends" },
  { value: "public", label: "Public" },
];

const STATUS_OPTIONS: { value: BitesFilterState["bookmarkStatuses"][number]; label: string }[] = [
  { value: "want_to_try", label: "Try Next" },
  { value: "planned", label: "Planned" },
];

/** Score filters use the 1–10 display scale (not 0–100 normalized). */
const RATING_PRESETS = [
  { label: "Any", min: null, max: null },
  { label: "7+", min: 7, max: null },
  { label: "8+", min: 8, max: null },
  { label: "9+", min: 9, max: null },
];

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function BitesFiltersSheet({
  visible,
  onClose,
  segment,
  draft,
  onChange,
  onApply,
  onClear,
  cuisineOptions,
  cityOptions,
}: {
  visible: boolean;
  onClose: () => void;
  segment: BitesSegment;
  draft: BitesFilterState;
  onChange: (next: BitesFilterState) => void;
  onApply: () => void;
  onClear: () => void;
  cuisineOptions: string[];
  cityOptions: string[];
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();
  const showVisibility = segment === "journal";
  const showRating = segment === "journal" || segment === "favorites";
  const showStatus = segment === "want_to_try";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} accessibilityLabel="Dismiss filters" />
        <View
          className="bg-white dark:bg-savr-900 rounded-t-3xl max-h-[80%]"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-savr-200 dark:bg-savr-700" />
          </View>
          <View className="flex-row items-center justify-between px-5 pb-3">
            <Text className={`text-xl font-bold ${ui.text.primary}`}>Filters</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close filters">
              <Ionicons name="close" size={24} color={colors.iconMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerClassName="px-5 pb-4 gap-5" showsVerticalScrollIndicator={false}>
            {cuisineOptions.length > 0 ? (
              <View className="gap-2">
                <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
                  Cuisine
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {cuisineOptions.map((c) => (
                    <Tag
                      key={c}
                      label={c}
                      active={draft.cuisines.includes(c)}
                      onPress={() =>
                        onChange({ ...draft, cuisines: toggleInList(draft.cuisines, c) })
                      }
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {cityOptions.length > 0 ? (
              <View className="gap-2">
                <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
                  City
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {cityOptions.map((c) => (
                    <Tag
                      key={c}
                      label={c}
                      active={draft.cities.includes(c)}
                      onPress={() => onChange({ ...draft, cities: toggleInList(draft.cities, c) })}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {showRating ? (
              <View className="gap-2">
                <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
                  Score
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {RATING_PRESETS.map((p) => {
                    const active = draft.minRating === p.min && draft.maxRating === p.max;
                    return (
                      <Tag
                        key={p.label}
                        label={p.label}
                        active={active}
                        onPress={() => onChange({ ...draft, minRating: p.min, maxRating: p.max })}
                      />
                    );
                  })}
                </View>
              </View>
            ) : null}

            {showVisibility ? (
              <View className="gap-2">
                <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
                  Visibility
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <Tag
                      key={opt.value}
                      label={opt.label}
                      active={draft.visibility.includes(opt.value)}
                      onPress={() =>
                        onChange({
                          ...draft,
                          visibility: toggleInList(draft.visibility, opt.value),
                        })
                      }
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {showStatus ? (
              <View className="gap-2">
                <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
                  Status
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <Tag
                      key={opt.value}
                      label={opt.label}
                      active={draft.bookmarkStatuses.includes(opt.value)}
                      onPress={() =>
                        onChange({
                          ...draft,
                          bookmarkStatuses: toggleInList(draft.bookmarkStatuses, opt.value),
                        })
                      }
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View className="flex-row gap-3 px-5 pt-2">
            <View className="flex-1">
              <Button label="Clear All" variant="secondary" onPress={onClear} />
            </View>
            <View className="flex-1">
              <Button label="Apply" onPress={onApply} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
