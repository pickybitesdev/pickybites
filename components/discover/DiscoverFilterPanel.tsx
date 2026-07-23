import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tag } from "@/components/ui/Tag";
import { CUISINES } from "@/lib/types";
import { ui } from "@/constants/ui";
import { iconColors } from "@/constants/ui";
import { useThemeStore } from "@/store/useThemeStore";
import { DISCOVER_TABS, type DiscoverTab } from "@/lib/discover-curated";
import { MAX_DISCOVER_RADIUS_METERS } from "@/lib/places/nearby-search";

const DISTANCE_OPTIONS = [
  { label: "0.5 mi", meters: 800 },
  { label: "1 mi", meters: 1609 },
  { label: "3 mi", meters: 4828 },
  { label: "5 mi", meters: 8047 },
  { label: "10 mi", meters: MAX_DISCOVER_RADIUS_METERS },
] as const;

export { DISTANCE_OPTIONS };

export function DiscoverFilterPanel({
  curatedTab,
  onTabChange,
  cuisine,
  onCuisineChange,
  radiusMeters,
  onRadiusChange,
  showDistance,
}: {
  curatedTab: DiscoverTab;
  onTabChange: (tab: DiscoverTab) => void;
  cuisine: string | null;
  onCuisineChange: (cuisine: string | null) => void;
  radiusMeters: number;
  onRadiusChange: (meters: number) => void;
  showDistance: boolean;
}) {
  const isDark = useThemeStore((s) => s.resolved) === "dark";
  const icon = isDark ? iconColors.brandDark : iconColors.brand;

  return (
    <View className={`rounded-2xl p-4 gap-4 ${ui.surface.card}`}>
      <View className="gap-2">
        <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>Browse</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {DISCOVER_TABS.map((tab) => (
            <Tag
              key={tab.value}
              label={tab.label}
              active={curatedTab === tab.value}
              onPress={() => onTabChange(tab.value)}
            />
          ))}
        </ScrollView>
      </View>

      <View className="gap-2">
        <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>Cuisine</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          <Tag label="All" active={!cuisine} onPress={() => onCuisineChange(null)} />
          {CUISINES.map((c) => (
            <Tag
              key={c}
              label={c}
              active={cuisine === c}
              onPress={() => onCuisineChange(cuisine === c ? null : c)}
            />
          ))}
        </ScrollView>
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
    </View>
  );
}

export function DiscoverScreenHeader({
  mapMode,
  onMapModeChange,
  subtitle,
}: {
  mapMode: boolean;
  onMapModeChange: (map: boolean) => void;
  subtitle?: string;
}) {
  return (
    <View className="gap-3">
      <View>
        <Text className={`text-2xl font-bold ${ui.text.primary}`}>Discover</Text>
        <Text className={`text-sm mt-0.5 ${ui.text.muted}`}>{subtitle ?? "Find your next meal"}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => onMapModeChange(false)}
          className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl ${
            !mapMode ? "bg-savr-500" : ui.surface.muted
          }`}
        >
          <Ionicons name="list" size={18} color={!mapMode ? "#fff" : iconColors.muted} />
          <Text className={`font-semibold text-sm ${!mapMode ? "text-white" : ui.text.secondary}`}>List</Text>
        </Pressable>
        <Pressable
          onPress={() => onMapModeChange(true)}
          className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl ${
            mapMode ? "bg-savr-500" : ui.surface.muted
          }`}
        >
          <Ionicons name="map" size={18} color={mapMode ? "#fff" : iconColors.muted} />
          <Text className={`font-semibold text-sm ${mapMode ? "text-white" : ui.text.secondary}`}>Map</Text>
        </Pressable>
      </View>
    </View>
  );
}
