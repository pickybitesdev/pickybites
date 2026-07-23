import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Dish, Restaurant } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import { ui } from "@/constants/ui";

export function DishCard({ dish, restaurant }: { dish: Dish; restaurant: Restaurant }) {
  return (
    <Pressable onPress={() => router.push(`/dish/${dish.id}`)}>
      <Card className="flex-row items-center gap-3">
        <View className={`w-12 h-12 rounded-xl items-center justify-center ${ui.surface.muted}`}>
          {dish.isBestDish ? <Ionicons name="trophy" size={20} color="#FF8559" /> : <Text>🍽️</Text>}
        </View>
        <View className="flex-1">
          <Text className={`font-semibold ${ui.text.primary}`}>{dish.name}</Text>
          <Text className={`text-xs ${ui.text.muted}`}>{restaurant.name}</Text>
        </View>
        <Rating value={dish.rating} size="sm" />
      </Card>
    </Pressable>
  );
}

