import { View, Text, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";
import {
  ADD_BITE_MAX_DISHES,
  type AddBiteDishDraft,
} from "@/lib/add-bite-draft";
import { formatUserRating } from "@/lib/rating-scale";
import { useThemedColors } from "@/lib/useThemedColors";

export function NewPostDishesSection({
  dishes,
  onChange,
}: {
  dishes: AddBiteDishDraft[];
  onChange: (dishes: AddBiteDishDraft[]) => void;
}) {
  const colors = useThemedColors();
  const canAdd = dishes.length < ADD_BITE_MAX_DISHES;

  const updateAt = (index: number, patch: Partial<AddBiteDishDraft>) => {
    onChange(dishes.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const removeAt = (index: number) => {
    onChange(dishes.filter((_, i) => i !== index));
  };

  const addDish = () => {
    if (!canAdd) return;
    onChange([
      ...dishes,
      {
        name: "",
        ratingValue: 8,
        notes: "",
        isBestDish: false,
        photoUri: null,
      },
    ]);
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline gap-2">
        <Ionicons name="restaurant-outline" size={20} color={brandColors.primary} />
        <Text className={`text-base font-semibold ${ui.text.primary}`}>Dishes</Text>
        <Text className={`text-xs ${ui.text.muted}`}>Optional</Text>
      </View>

      {dishes.length === 0 ? (
        <Text className={`text-xs ${ui.text.muted}`}>
          Rate what you ordered — skip if you’re just scoring the visit.
        </Text>
      ) : null}

      {dishes.map((dish, index) => (
        <View
          key={`dish-${index}`}
          className="gap-2 rounded-2xl border px-3 py-3"
          style={{ borderColor: brandColors.border, backgroundColor: brandColors.surface }}
        >
          <View className="flex-row items-center gap-2">
            <TextInput
              value={dish.name}
              onChangeText={(name) => updateAt(index, { name })}
              placeholder="Dish name"
              placeholderTextColor={colors.placeholder}
              className={`flex-1 text-base ${ui.text.primary}`}
              accessibilityLabel={`Dish ${index + 1} name`}
            />
            <Text className={`text-base font-bold ${ui.text.primary}`}>
              {formatUserRating(dish.ratingValue, 10)}
            </Text>
            <Pressable
              onPress={() => removeAt(index)}
              accessibilityRole="button"
              accessibilityLabel={`Remove dish ${index + 1}`}
              hitSlop={8}
              className="p-1"
            >
              <Ionicons name="close-circle" size={22} color={brandColors.iconInactive} />
            </Pressable>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
              const selected = Math.round(dish.ratingValue) === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => updateAt(index, { ratingValue: n })}
                  accessibilityLabel={`Rate dish ${index + 1} ${n} out of 10`}
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
        </View>
      ))}

      {canAdd ? (
        <Pressable
          onPress={addDish}
          accessibilityRole="button"
          accessibilityLabel="Add a dish"
          className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed py-3"
          style={{ borderColor: brandColors.border }}
        >
          <Ionicons name="add" size={20} color={brandColors.primary} />
          <Text className={`text-sm font-semibold`} style={{ color: brandColors.primary }}>
            {dishes.length === 0 ? "Add a dish" : "Add another dish"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
