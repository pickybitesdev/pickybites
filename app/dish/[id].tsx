import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { ui } from "@/constants/ui";

export default function DishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dishId = Array.isArray(id) ? id[0] : id;
  const { getDish, getRestaurant, getReview, getUser } = useAppStore();
  const dish = dishId ? getDish(dishId) : undefined;
  const restaurant = dish ? getRestaurant(dish.restaurantId) : undefined;
  const review = dish ? getReview(dish.reviewId) : undefined;
  const user = review ? getUser(review.userId) : undefined;

  if (!dish || !restaurant) {
    return (
      <View className={`flex-1 items-center justify-center ${ui.screen}`}>
        <Text className={ui.text.muted}>Dish not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView className={`flex-1 ${ui.screen}`} contentContainerClassName="px-4 pb-6 gap-4">
      <Card className="items-center py-8">
        <Text className="text-5xl mb-3">🍽️</Text>
        <Text className={`text-2xl font-bold ${ui.text.primary}`}>{dish.name}</Text>
        <Pressable onPress={() => router.push(`/restaurant/${restaurant.id}`)}>
          <Text className={`font-medium mt-1 ${ui.text.secondary}`}>{restaurant.name}</Text>
        </Pressable>
        <Text className={`text-sm ${ui.text.muted}`}>{restaurant.city}</Text>
        <View className="flex-row items-center gap-2 mt-4">
          <Rating value={dish.rating} size="lg" />
          {dish.isBestDish && (
            <View className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${ui.surface.muted}`}>
              <Ionicons name="trophy" size={14} color="#FF8559" />
              <Text className={`text-sm font-medium ${ui.text.secondary}`}>Best Dish</Text>
            </View>
          )}
        </View>
      </Card>
      {dish.notes && (
        <Card>
          <Text className={`font-semibold mb-2 ${ui.text.primary}`}>Notes</Text>
          <Text className={`text-sm ${ui.text.secondary}`}>{dish.notes}</Text>
        </Card>
      )}
      {review && user && (
        <Card className="gap-3">
          <Text className={`font-semibold ${ui.text.primary}`}>From Review</Text>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.push(`/user/${user.id}`)}>
              <Avatar name={user.displayName} src={user.avatarUrl} size="sm" />
            </Pressable>
            <View className="flex-1">
              <Text className={`text-sm font-semibold ${ui.text.primary}`}>{user.displayName}</Text>
              <Text className={`text-xs ${ui.text.muted}`}>Visited {formatDate(review.visitDate)}</Text>
            </View>
            <Rating value={review.rating} size="sm" />
          </View>
          <Text className={`text-sm ${ui.text.secondary}`}>{review.text}</Text>
          <View className="flex-row flex-wrap gap-1">{review.tags.map((t) => <Tag key={t} label={t} />)}</View>
        </Card>
      )}
    </ScrollView>
  );
}

