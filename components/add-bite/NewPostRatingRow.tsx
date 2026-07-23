import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";
import { ADD_BITE_RATING_SCORE_HINT } from "@/lib/add-bite-draft";
import { formatUserRating } from "@/lib/rating-scale";

export function NewPostRatingRow({
  value,
  chosen,
  onChange,
}: {
  value: number;
  chosen: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Ionicons name="star" size={20} color={brandColors.primary} />
        <Text className={`text-base font-semibold ${ui.text.primary}`}>Overall</Text>
        <Text className={`ml-auto text-lg font-bold ${ui.text.primary}`}>
          {chosen ? formatUserRating(value, 10) : "—"}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const selected = chosen && Math.round(value) === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              accessibilityLabel={`Rate ${n} out of 10`}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{
                backgroundColor: selected ? brandColors.primary : brandColors.primaryLight,
              }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 13,
                  color: selected ? "#FFFFFF" : brandColors.textPrimary,
                }}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className={`text-xs ${ui.text.muted}`}>
        {chosen ? ADD_BITE_RATING_SCORE_HINT : "Tap a score from 1 to 10."}
      </Text>
    </View>
  );
}
