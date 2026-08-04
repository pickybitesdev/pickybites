import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CategoryRatingRow } from "@/components/reviews/CategoryRatingRow";
import { CATEGORY_LABELS, computeAutoOverall } from "@/lib/review-scores";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";
import type { ReviewCategoryScores } from "@/lib/types";

/**
 * Per-category scoring on the create screen.
 *
 * New Post previously copied the overall score into all four categories and
 * marked it a manual override, so every created review carried four identical
 * fabricated scores. Only the edit screen could set them for real. This is the
 * same CategoryRatingRow the edit screen uses, so the two agree.
 *
 * Collapsed by default: the quick 1-10 tap stays the fast path, and categories
 * are opt-in for people who want to be precise.
 */
export function NewPostCategorySection({
  expanded,
  onToggle,
  scores,
  onChange,
  overall,
  manualOverride,
  onUseAutoOverall,
}: {
  expanded: boolean;
  onToggle: () => void;
  scores: ReviewCategoryScores;
  onChange: (next: ReviewCategoryScores) => void;
  overall: number;
  manualOverride: boolean;
  onUseAutoOverall: () => void;
}) {
  const auto = computeAutoOverall(scores);

  return (
    <View className="gap-2">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="flex-row items-center gap-2 py-1"
      >
        <Ionicons name="options-outline" size={18} color={brandColors.primary} />
        <Text className={`text-sm font-semibold ${ui.text.primary}`}>
          Rate by category
        </Text>
        <Text className={`text-xs ${ui.text.muted}`}>Optional</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={brandColors.iconInactive}
          style={{ marginLeft: "auto" }}
        />
      </Pressable>

      {expanded ? (
        <View
          className="gap-1 rounded-2xl border p-3"
          style={{ borderColor: brandColors.border }}
        >
          {CATEGORY_LABELS.map(({ key, label }) => (
            <CategoryRatingRow
              key={key}
              label={label}
              value={scores[key]}
              onChange={(score) => onChange({ ...scores, [key]: score })}
            />
          ))}

          {manualOverride && Math.abs(auto - overall) >= 0.05 ? (
            <Pressable onPress={onUseAutoOverall} className="pt-2">
              <Text className="text-sm font-semibold" style={{ color: brandColors.primary }}>
                Use category average ({auto.toFixed(1)}) as overall
              </Text>
            </Pressable>
          ) : (
            <Text className={`text-xs pt-2 ${ui.text.muted}`}>
              Overall is the average of these unless you tap a score above.
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
