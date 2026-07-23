import { Modal, View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { CUISINES } from "@/lib/types";
import { DISCOVER_TABS, type DiscoverTab } from "@/lib/discover-curated";
import { DISTANCE_OPTIONS } from "@/components/discover/DiscoverFilterPanel";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";

export function DiscoverFiltersSheet({
  visible,
  onClose,
  curatedTab,
  onTabChange,
  cuisine,
  onCuisineChange,
  radiusMeters,
  onRadiusChange,
  showDistance,
  showBrowseTabs = true,
  openNowOnly = false,
  onOpenNowOnlyChange,
  onReset,
}: {
  visible: boolean;
  onClose: () => void;
  curatedTab: DiscoverTab;
  onTabChange: (tab: DiscoverTab) => void;
  cuisine: string | null;
  onCuisineChange: (cuisine: string | null) => void;
  radiusMeters: number;
  onRadiusChange: (meters: number) => void;
  showDistance: boolean;
  /** Community browse tabs only apply in list mode. */
  showBrowseTabs?: boolean;
  openNowOnly?: boolean;
  onOpenNowOnlyChange?: (value: boolean) => void;
  onReset: () => void;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();

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
            {showBrowseTabs ? (
              <View className="gap-2">
                <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
                  Browse
                </Text>
                <Text className={`text-xs ${ui.text.secondary}`}>
                  Community lists — shown in List view
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {DISCOVER_TABS.map((tab) => (
                    <Tag
                      key={tab.value}
                      label={tab.label}
                      active={curatedTab === tab.value}
                      onPress={() => onTabChange(tab.value)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View className="gap-2">
              <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>Cuisine</Text>
              <View className="flex-row flex-wrap gap-2">
                <Tag label="All" active={!cuisine} onPress={() => onCuisineChange(null)} />
                {CUISINES.map((c) => (
                  <Tag
                    key={c}
                    label={c}
                    active={cuisine === c}
                    onPress={() => onCuisineChange(cuisine === c ? null : c)}
                  />
                ))}
              </View>
            </View>

            {showDistance ? (
              <View className="gap-2">
                <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>Distance</Text>
                <View className="flex-row flex-wrap gap-2">
                  {DISTANCE_OPTIONS.map((opt) => (
                    <Tag
                      key={opt.meters}
                      label={opt.label}
                      active={radiusMeters === opt.meters}
                      onPress={() => onRadiusChange(opt.meters)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {onOpenNowOnlyChange ? (
              <View className="gap-2">
                <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
                  Hours
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <Tag
                    label="Any hours"
                    active={!openNowOnly}
                    onPress={() => onOpenNowOnlyChange(false)}
                  />
                  <Tag
                    label="Open now"
                    active={openNowOnly}
                    onPress={() => onOpenNowOnlyChange(true)}
                  />
                </View>
              </View>
            ) : null}

            <View className="flex-row gap-3 pt-1">
              <Button label="Reset" variant="secondary" onPress={onReset} className="flex-1" />
              <Button label="Apply" onPress={onClose} className="flex-1" />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function DiscoverFiltersButton({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  const colors = useThemedColors();
  const label = count > 0 ? `Filters (${count})` : "Filters";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center gap-1.5 rounded-xl border border-savr-200 dark:border-savr-700 bg-white dark:bg-savr-900 px-3 h-12"
    >
      <Ionicons name="options-outline" size={18} color={colors.brand} />
      {count > 0 ? (
        <View className="min-w-[18px] h-[18px] rounded-full bg-savr-500 items-center justify-center px-1">
          <Text className="text-[10px] font-bold text-white">{count}</Text>
        </View>
      ) : (
        <Text className={`text-sm font-semibold ${ui.text.secondary}`}>Filters</Text>
      )}
    </Pressable>
  );
}
