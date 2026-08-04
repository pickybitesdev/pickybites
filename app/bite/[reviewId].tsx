import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { toFoodJournalEntry } from "@/lib/foodJournal";
import { Button } from "@/components/ui/Button";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { formatDate } from "@/lib/utils";
import { Tag } from "@/components/ui/Tag";
import { CATEGORY_LABELS, WAIT_TIME_OPTIONS } from "@/lib/review-scores";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import type { ReviewVisibility } from "@/lib/types";
import { canViewBiteReview } from "@/lib/bite-access";

const VISIBILITY_LABEL: Record<ReviewVisibility, string> = {
  private: "Private",
  friends: "Friends",
  public: "Public",
};

export default function BiteDetailScreen() {
  const { reviewId } = useLocalSearchParams<{ reviewId: string }>();
  const colors = useThemedColors();
  const currentUserId = useAppStore((s) => s.currentUserId);
  const review = useAppStore((s) => s.getReview(reviewId));
  const restaurant = useAppStore((s) =>
    review ? s.getRestaurant(review.restaurantId) : undefined,
  );
  const dishes = useAppStore((s) => s.dishes);
  const reviewPhotos = useAppStore((s) => s.reviewPhotos);
  const follows = useAppStore((s) => s.follows);
  const deleteReview = useAppStore((s) => s.deleteReview);
  const updateReviewVisibility = useAppStore((s) => s.updateReviewVisibility);
  const [refreshing, setRefreshing] = useState(false);

  const isOwn = Boolean(review && currentUserId && review.userId === currentUserId);
  const isFollowingAuthor = Boolean(
    review &&
      currentUserId &&
      follows.some((f) => f.followerId === currentUserId && f.followingId === review.userId),
  );
  const canView = review
    ? canViewBiteReview({
        reviewUserId: review.userId,
        visibility: review.visibility,
        currentUserId,
        isFollowingAuthor,
      })
    : false;

  const entry = useMemo(() => {
    if (!review) return null;
    return toFoodJournalEntry(review, restaurant, dishes, reviewPhotos);
  }, [review, restaurant, dishes, reviewPhotos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await useAppStore.getState().loadData();
    setRefreshing(false);
  }, []);

  if (!review || !entry || !canView) {
    return (
      <SafeAreaView className={`flex-1 ${ui.screen}`}>
        <Stack.Screen options={{ title: "Review" }} />
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <Text className={`text-base ${ui.text.muted}`}>Review not found</Text>
          <Button label="Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // Friend / public review — social read view with likes & comments.
  if (!isOwn) {
    return (
      <SafeAreaView className={`flex-1 ${ui.screen}`} edges={["bottom"]}>
        <Stack.Screen options={{ title: entry.restaurant_name }} />
        <ScrollView
          contentContainerClassName="px-4 pb-10 gap-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.spinner} />
          }
        >
          <ReviewCard review={review} showRestaurant showAuthorLink />
          <Button
            label="View restaurant"
            variant="secondary"
            onPress={() => router.push(`/restaurant/${entry.restaurant_id}`)}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Fields the composer captures but the detail view never surfaced.
  const visitFacts = [
    entry.wait_time
      ? {
          label: "Wait",
          value: WAIT_TIME_OPTIONS.find((o) => o.value === entry.wait_time)?.label ?? entry.wait_time,
        }
      : null,
    entry.would_return === null
      ? null
      : { label: "Would return", value: entry.would_return ? "Yes" : "No" },
    entry.would_recommend === null
      ? null
      : { label: "Would recommend", value: entry.would_recommend ? "Yes" : "No" },
  ].filter((f): f is { label: string; value: string } => f !== null);

  const cycleVisibility = async () => {
    const order: ReviewVisibility[] = ["private", "friends", "public"];
    const next = order[(order.indexOf(review.visibility) + 1) % order.length];
    const result = await updateReviewVisibility(review.id, next);
    if (!result.ok) Alert.alert("Error", result.error);
  };

  const confirmDelete = () => {
    Alert.alert("Delete this Bite?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await deleteReview(review.id);
          if ("error" in result) Alert.alert("Error", result.error);
          else router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView className={`flex-1 ${ui.screen}`} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: entry.restaurant_name,
          headerRight: () => (
            <Pressable
              onPress={() =>
                Alert.alert("Actions", undefined, [
                  {
                    text: "Edit",
                    onPress: () => router.push(`/add-review?reviewId=${review.id}`),
                  },
                  {
                    text: `Visibility: ${VISIBILITY_LABEL[review.visibility]}`,
                    onPress: () => void cycleVisibility(),
                  },
                  { text: "Delete", style: "destructive", onPress: confirmDelete },
                  { text: "Cancel", style: "cancel" },
                ])
              }
              hitSlop={8}
              accessibilityLabel="More actions"
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.icon} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentContainerClassName="px-4 pb-10 gap-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.spinner} />
        }
      >
        {entry.photos[0] ? (
          <Image
            source={{ uri: entry.photos[0] }}
            style={{ width: "100%", height: 220, borderRadius: 16 }}
            contentFit="cover"
          />
        ) : null}

        <View className="gap-1">
          <Text className={`text-2xl font-bold ${ui.text.primary}`}>{entry.restaurant_name}</Text>
          <Text className={`text-sm ${ui.text.muted}`}>
            {entry.cuisine}
            {entry.city ? ` · ${entry.city}` : ""}
            {` · ${formatDate(entry.visit_date)}`}
          </Text>
          <Text className={`text-lg font-bold mt-1 ${ui.text.primary}`}>
            {entry.rating_value}/{entry.rating_max}
          </Text>
          <Text className={`text-xs ${ui.text.muted}`}>{VISIBILITY_LABEL[entry.visibility]}</Text>
        </View>

        {entry.review_text ? (
          <Text className={`text-base leading-6 ${ui.text.secondary}`}>{entry.review_text}</Text>
        ) : null}

        {entry.tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {entry.tags.map((t) => (
              <Tag key={t} label={t} active size="sm" />
            ))}
          </View>
        ) : null}

        {visitFacts.length > 0 ? (
          <View className="gap-2">
            <Text className={`text-sm font-semibold uppercase ${ui.text.muted}`}>Visit</Text>
            {visitFacts.map(({ label, value }) => (
              <View key={label} className="flex-row items-center justify-between">
                <Text className={`text-sm ${ui.text.muted}`}>{label}</Text>
                <Text className={`text-sm font-medium ${ui.text.primary}`}>{value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {entry.rating_manual_override ? null : (
          <View className="gap-2">
            <Text className={`text-sm font-semibold uppercase ${ui.text.muted}`}>Scores</Text>
            {CATEGORY_LABELS.map(({ key, label }) => (
              <View key={key} className="flex-row items-center justify-between">
                <Text className={`text-sm ${ui.text.muted}`}>{label}</Text>
                <Text className={`text-sm font-medium ${ui.text.primary}`}>
                  {entry.category_scores[key]}/10
                </Text>
              </View>
            ))}
          </View>
        )}

        {entry.dishes.length > 0 ? (
          <View className="gap-2">
            <Text className={`text-sm font-semibold uppercase ${ui.text.muted}`}>Dishes</Text>
            {entry.dishes.map((d) => (
              <View
                key={d.dish_id}
                className={`flex-row items-center justify-between rounded-2xl px-3 py-3 ${ui.surface.inset}`}
              >
                <View className="flex-1 gap-0.5">
                  <Text className={`text-base font-medium ${ui.text.primary}`}>{d.dish_name}</Text>
                  <Text className={`text-xs ${ui.text.muted}`}>{d.dish_rating.toFixed(1)}/10</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <Button
          label="View restaurant"
          variant="secondary"
          onPress={() => router.push(`/restaurant/${entry.restaurant_id}`)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
