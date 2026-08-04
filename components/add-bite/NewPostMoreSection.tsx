import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tag } from "@/components/ui/Tag";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";
import {
  VisitDetailsFields,
  type VisitDetailsValue,
} from "@/components/reviews/VisitDetailsFields";
import type { ComparisonPreference, Restaurant } from "@/lib/types";

export function NewPostMoreSection({
  expanded,
  onToggle,
  options,
  compareRestaurantId,
  comparePreference,
  onSelectRestaurant,
  onSelectPreference,
  onClear,
  visitDetails,
  onVisitDetailsChange,
}: {
  expanded: boolean;
  onToggle: () => void;
  options: Restaurant[];
  compareRestaurantId: string | null;
  comparePreference: ComparisonPreference | null;
  onSelectRestaurant: (id: string) => void;
  onSelectPreference: (pref: ComparisonPreference) => void;
  onClear: () => void;
  visitDetails: VisitDetailsValue;
  onVisitDetailsChange: (next: VisitDetailsValue) => void;
}) {
  return (
    <View className="gap-2">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="flex-row items-center justify-between py-1"
      >
        <Text className={`text-base font-semibold ${ui.text.primary}`}>More</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={brandColors.iconInactive}
        />
      </Pressable>

      {expanded ? (
        <View className="gap-5">
          <View
            className="gap-3 rounded-2xl border p-3"
            style={{ borderColor: brandColors.border }}
          >
            <VisitDetailsFields value={visitDetails} onChange={onVisitDetailsChange} />
          </View>

        <View className="gap-3 rounded-2xl border p-3" style={{ borderColor: brandColors.border }}>
          <View className="gap-1">
            <Text className={`text-sm font-semibold ${ui.text.primary}`}>
              Compare to a similar place
            </Text>
            <Text className={`text-xs ${ui.text.secondary}`}>
              Optional — only places you’ve already reviewed.
            </Text>
          </View>

          {options.length === 0 ? (
            <Text className={`text-sm ${ui.text.muted}`}>No similar reviewed places yet.</Text>
          ) : (
            options.map((r) => {
              const selected = compareRestaurantId === r.id;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => onSelectRestaurant(r.id)}
                  className="rounded-xl border p-3"
                  style={{
                    borderColor: selected ? brandColors.primary : brandColors.border,
                    backgroundColor: selected ? brandColors.primaryLight : brandColors.surface,
                  }}
                >
                  <Text className={`font-semibold ${ui.text.primary}`}>{r.name}</Text>
                  <Text className={`text-xs ${ui.text.secondary}`}>
                    {r.cuisine} · {r.city}
                  </Text>
                </Pressable>
              );
            })
          )}

          {compareRestaurantId ? (
            <View className="flex-row flex-wrap gap-2">
              {(
                [
                  ["current", "This place"],
                  ["compared", "The other"],
                  ["equal", "About the same"],
                ] as const
              ).map(([pref, label]) => (
                <Tag
                  key={pref}
                  label={label}
                  active={comparePreference === pref}
                  onPress={() => onSelectPreference(pref)}
                />
              ))}
            </View>
          ) : null}

          {compareRestaurantId ? (
            <Pressable onPress={onClear} hitSlop={8}>
              <Text className={`text-sm font-semibold ${ui.text.secondary}`}>Clear compare</Text>
            </Pressable>
          ) : null}
        </View>
        </View>
      ) : null}
    </View>
  );
}
