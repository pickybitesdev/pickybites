import { View, Text } from "react-native";
import { Tag } from "@/components/ui/Tag";
import { VisitDatePicker } from "@/components/reviews/VisitDatePicker";
import { WAIT_TIME_OPTIONS } from "@/lib/review-scores";
import { REVIEW_TAGS } from "@/lib/types";
import type { ReviewTag, WaitTime } from "@/lib/types";
import { ui } from "@/constants/ui";

/**
 * The visit details shared by BOTH review flows.
 *
 * These fields used to exist only on the edit screen, while New Post silently
 * submitted their defaults — so a detail you entered on create was
 * unreachable, and the two screens disagreed about what a review even is.
 * Defined once here and rendered by both.
 *
 * `showDate` is off inside StructuredRatingForm, which is itself embedded in
 * screens that place the date picker separately.
 */
export type VisitDetailsValue = {
  waitTime: WaitTime | null;
  wouldReturn: boolean | null;
  wouldRecommend: boolean | null;
  visitDate: string;
  tags: ReviewTag[];
};

function TriState({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (next: boolean | null) => void;
}) {
  return (
    <View className="gap-2">
      <Text className={`text-xs font-semibold uppercase ${ui.text.muted}`}>{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        <Tag label="Skip" active={value === null} onPress={() => onChange(null)} size="sm" />
        <Tag label="Yes" active={value === true} onPress={() => onChange(true)} size="sm" />
        <Tag label="No" active={value === false} onPress={() => onChange(false)} size="sm" />
      </View>
    </View>
  );
}

export function VisitDetailsFields({
  value,
  onChange,
  showWaitTime = true,
  showOpinions = true,
  showDate = true,
  showTags = true,
}: {
  value: VisitDetailsValue;
  onChange: (next: VisitDetailsValue) => void;
  showWaitTime?: boolean;
  showOpinions?: boolean;
  showDate?: boolean;
  showTags?: boolean;
}) {
  const patch = (part: Partial<VisitDetailsValue>) => onChange({ ...value, ...part });

  const toggleTag = (t: ReviewTag) =>
    patch({
      tags: value.tags.includes(t) ? value.tags.filter((x) => x !== t) : [...value.tags, t],
    });

  return (
    <View className="gap-5">
      {showWaitTime ? (
        <View className="gap-2">
          <Text className={`text-xs font-semibold uppercase ${ui.text.muted}`}>
            Wait time (optional)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Tag
              label="Skip"
              active={value.waitTime === null}
              onPress={() => patch({ waitTime: null })}
              size="sm"
            />
            {WAIT_TIME_OPTIONS.map((opt) => (
              <Tag
                key={opt.value}
                label={opt.label}
                active={value.waitTime === opt.value}
                onPress={() => patch({ waitTime: opt.value })}
                size="sm"
              />
            ))}
          </View>
        </View>
      ) : null}

      {showOpinions ? (
        <>
          <TriState
            label="Would return? (optional)"
            value={value.wouldReturn}
            onChange={(wouldReturn) => patch({ wouldReturn })}
          />
          <TriState
            label="Would recommend? (optional)"
            value={value.wouldRecommend}
            onChange={(wouldRecommend) => patch({ wouldRecommend })}
          />
        </>
      ) : null}

      {showDate ? (
        <VisitDatePicker value={value.visitDate} onChange={(visitDate) => patch({ visitDate })} />
      ) : null}

      {showTags ? (
        <View className="gap-2">
          <Text className={`text-xs font-semibold uppercase ${ui.text.muted}`}>Tags</Text>
          <View className="flex-row flex-wrap gap-2">
            {REVIEW_TAGS.map((t) => (
              <Tag key={t} label={t} active={value.tags.includes(t)} onPress={() => toggleTag(t)} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
