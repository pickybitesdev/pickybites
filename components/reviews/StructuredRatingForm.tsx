import { View, Text, Pressable } from "react-native";
import type { ReviewCategoryScores, WaitTime } from "@/lib/types";
import {
  CATEGORY_LABELS,
  WAIT_TIME_OPTIONS,
  computeAutoOverall,
} from "@/lib/review-scores";
import { clampRating } from "@/lib/review-validation";
import { CategoryRatingRow } from "@/components/reviews/CategoryRatingRow";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { ui } from "@/constants/ui";
import { cn } from "@/lib/utils";

export type StructuredRatingState = {
  categoryScores: ReviewCategoryScores;
  rating: number;
  ratingManualOverride: boolean;
  waitTime: WaitTime | null;
  wouldReturn: boolean | null;
  wouldRecommend: boolean | null;
};

type Props = {
  value: StructuredRatingState;
  onChange: (next: StructuredRatingState) => void;
};

export function StructuredRatingForm({ value, onChange }: Props) {
  const autoOverall = computeAutoOverall(value.categoryScores);

  const setCategory = (key: keyof ReviewCategoryScores, score: number) => {
    const categoryScores = { ...value.categoryScores, [key]: score };
    const next: StructuredRatingState = { ...value, categoryScores };
    if (!value.ratingManualOverride) {
      next.rating = computeAutoOverall(categoryScores);
    }
    onChange(next);
  };

  const setManualOverride = (manual: boolean) => {
    onChange({
      ...value,
      ratingManualOverride: manual,
      rating: manual ? value.rating : autoOverall,
    });
  };

  const setOverall = (rating: number) => {
    onChange({ ...value, rating: clampRating(rating), ratingManualOverride: true });
  };

  return (
    <View className="gap-5">
      <View>
        <Text className={`text-2xl font-bold ${ui.text.primary}`}>Rate your visit</Text>
        <Text className={`text-sm mt-1 ${ui.text.secondary}`}>
          Score each category — overall updates automatically.
        </Text>
      </View>

      <Card className="gap-1 p-4">
        {CATEGORY_LABELS.map(({ key, label }) => (
          <CategoryRatingRow
            key={key}
            label={label}
            value={value.categoryScores[key]}
            onChange={(score) => setCategory(key, score)}
          />
        ))}
      </Card>

      <Card className={cn("gap-3 p-4", ui.accentCard)}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`text-xs uppercase tracking-widest font-semibold ${ui.text.muted}`}>
              Overall
            </Text>
            <Text className={`text-4xl font-black mt-1 ${ui.text.primary}`}>
              {value.rating.toFixed(1)}
            </Text>
            {!value.ratingManualOverride && (
              <Text className={`text-xs mt-1 ${ui.text.muted}`}>Auto · avg of categories</Text>
            )}
          </View>
          {value.ratingManualOverride ? (
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setOverall(value.rating - 0.1)}
                className={cn("w-12 h-12 rounded-xl items-center justify-center", ui.surface.muted)}
              >
                <Text className={`text-xl ${ui.text.primary}`}>−</Text>
              </Pressable>
              <Pressable
                onPress={() => setOverall(value.rating + 0.1)}
                className={cn("w-12 h-12 rounded-xl items-center justify-center", ui.surface.muted)}
              >
                <Text className={`text-xl ${ui.text.primary}`}>+</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Pressable onPress={() => setManualOverride(!value.ratingManualOverride)}>
          <Text className="text-sm font-semibold text-savr-350 dark:text-savr-400">
            {value.ratingManualOverride ? "Use auto-calculated overall" : "Adjust overall manually"}
          </Text>
        </Pressable>
      </Card>

      <View className="gap-2">
        <Text className={`text-xs font-semibold uppercase ${ui.text.muted}`}>Wait time (optional)</Text>
        <View className="flex-row flex-wrap gap-2">
          <Tag
            label="Skip"
            active={value.waitTime === null}
            onPress={() => onChange({ ...value, waitTime: null })}
            size="sm"
          />
          {WAIT_TIME_OPTIONS.map((opt) => (
            <Tag
              key={opt.value}
              label={opt.label}
              active={value.waitTime === opt.value}
              onPress={() => onChange({ ...value, waitTime: opt.value })}
              size="sm"
            />
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text className={`text-xs font-semibold uppercase ${ui.text.muted}`}>Would return? (optional)</Text>
        <View className="flex-row flex-wrap gap-2">
          <Tag label="Skip" active={value.wouldReturn === null} onPress={() => onChange({ ...value, wouldReturn: null })} size="sm" />
          <Tag label="Yes" active={value.wouldReturn === true} onPress={() => onChange({ ...value, wouldReturn: true })} size="sm" />
          <Tag label="No" active={value.wouldReturn === false} onPress={() => onChange({ ...value, wouldReturn: false })} size="sm" />
        </View>
      </View>

      <View className="gap-2">
        <Text className={`text-xs font-semibold uppercase ${ui.text.muted}`}>Would recommend? (optional)</Text>
        <View className="flex-row flex-wrap gap-2">
          <Tag label="Skip" active={value.wouldRecommend === null} onPress={() => onChange({ ...value, wouldRecommend: null })} size="sm" />
          <Tag label="Yes" active={value.wouldRecommend === true} onPress={() => onChange({ ...value, wouldRecommend: true })} size="sm" />
          <Tag label="No" active={value.wouldRecommend === false} onPress={() => onChange({ ...value, wouldRecommend: false })} size="sm" />
        </View>
      </View>
    </View>
  );
}

export function createStructuredRatingState(
  partial?: Partial<StructuredRatingState>,
): StructuredRatingState {
  const categoryScores = partial?.categoryScores ?? {
    foodQuality: 8,
    service: 8,
    atmosphere: 8,
    value: 8,
  };
  const ratingManualOverride = partial?.ratingManualOverride ?? false;
  const rating = partial?.rating ?? computeAutoOverall(categoryScores);

  return {
    categoryScores,
    rating,
    ratingManualOverride,
    waitTime: partial?.waitTime ?? null,
    wouldReturn: partial?.wouldReturn ?? null,
    wouldRecommend: partial?.wouldRecommend ?? null,
  };
}
