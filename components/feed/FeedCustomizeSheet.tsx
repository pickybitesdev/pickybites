import { useEffect, useState } from "react";
import { Modal, View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { CUISINES, type Cuisine, type PriceLevel } from "@/lib/types";
import {
  DEFAULT_FEED_PREFERENCES,
  FEED_DISTANCE_OPTIONS,
  FEED_PRICE_OPTIONS,
  FEED_SORT_OPTIONS,
  type FeedPreferences,
} from "@/lib/feed-preferences";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";

export function FeedCustomizeSheet({
  visible,
  prefs,
  onClose,
  onApply,
  locationAvailable = true,
}: {
  visible: boolean;
  prefs: FeedPreferences;
  onClose: () => void;
  onApply: (prefs: FeedPreferences) => void;
  /** When false, distance filters cannot use GPS — show guidance. */
  locationAvailable?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();
  const [draft, setDraft] = useState<FeedPreferences>(prefs);

  useEffect(() => {
    if (visible) setDraft(prefs);
  }, [visible, prefs]);

  const togglePrice = (value: PriceLevel) => {
    setDraft((d) => {
      const has = d.priceLevels.includes(value);
      return {
        ...d,
        priceLevels: has ? d.priceLevels.filter((p) => p !== value) : [...d.priceLevels, value],
      };
    });
  };

  const toggleCuisine = (c: Cuisine) => {
    setDraft((d) => {
      const has = d.cuisineOverrides.includes(c);
      return {
        ...d,
        cuisineOverrides: has
          ? d.cuisineOverrides.filter((x) => x !== c)
          : [...d.cuisineOverrides, c],
      };
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} accessibilityLabel="Dismiss" />
        <View
          className="bg-white dark:bg-savr-900 rounded-t-3xl max-h-[85%]"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          testID="feed-customize-sheet"
        >
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-savr-200 dark:bg-savr-700" />
          </View>
          <View className="px-5 pb-3">
            <View className="flex-row items-center justify-between">
              <Text className={`text-xl font-bold ${ui.text.primary}`}>Customize Feed</Text>
              <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close Customize Feed">
                <Ionicons name="close" size={24} color={colors.iconMuted} />
              </Pressable>
            </View>
            <Text className={`text-sm mt-1 ${ui.text.secondary}`}>
              Filter activity from people you follow.
            </Text>
          </View>

          <ScrollView contentContainerClassName="px-5 pb-4 gap-5" showsVerticalScrollIndicator={false}>
            <View className="gap-2">
              <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
                Sort
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {FEED_SORT_OPTIONS.map((opt) => (
                  <Tag
                    key={opt.value}
                    label={opt.label}
                    active={draft.sort === opt.value}
                    onPress={() => setDraft((d) => ({ ...d, sort: opt.value }))}
                  />
                ))}
              </View>
              {draft.sort === "best_match" ? (
                <Text className={`text-xs ${ui.text.secondary}`} testID="feed-best-match-hint">
                  Best match prioritizes people with similar taste and more engagement.
                </Text>
              ) : null}
            </View>

            <View className="gap-2">
              <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
                Cuisine
              </Text>
              <Text className={`text-xs ${ui.text.secondary}`}>Leave empty to show all</Text>
              <View className="flex-row flex-wrap gap-2">
                {CUISINES.map((c) => (
                  <Tag
                    key={c}
                    label={c}
                    active={draft.cuisineOverrides.includes(c)}
                    onPress={() => toggleCuisine(c)}
                  />
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
                Price
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {FEED_PRICE_OPTIONS.map((opt) => (
                  <Tag
                    key={opt.value}
                    label={opt.label}
                    active={draft.priceLevels.includes(opt.value)}
                    onPress={() => togglePrice(opt.value)}
                  />
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
                Distance
              </Text>
              {!locationAvailable ? (
                <Text className={`text-xs ${ui.text.secondary}`} testID="feed-distance-location-hint">
                  Turn on location to filter by distance. Until then, choose Any distance.
                </Text>
              ) : null}
              <View className="flex-row flex-wrap gap-2">
                {FEED_DISTANCE_OPTIONS.map((opt) => {
                  const needsLocation = opt.value !== "any";
                  const disabled = needsLocation && !locationAvailable;
                  return (
                    <Tag
                      key={opt.value}
                      label={opt.label}
                      active={draft.distance === opt.value}
                      onPress={() => {
                        if (disabled) return;
                        setDraft((d) => ({ ...d, distance: opt.value }));
                      }}
                    />
                  );
                })}
              </View>
            </View>

            <View className="flex-row gap-3 pt-1">
              <Button
                label="Reset"
                variant="secondary"
                onPress={() => {
                  // Draft only — Apply persists. Avoid accidental save on Reset.
                  setDraft({ ...DEFAULT_FEED_PREFERENCES });
                }}
                className="flex-1"
                testID="feed-customize-reset"
              />
              <Button
                label="Apply"
                onPress={() => {
                  const next =
                    !locationAvailable && draft.distance !== "any"
                      ? { ...draft, distance: "any" as const }
                      : draft;
                  onApply(next);
                  onClose();
                }}
                className="flex-1"
                testID="feed-customize-apply"
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
