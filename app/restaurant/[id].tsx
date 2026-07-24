import { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { getRestaurantRatingsBreakdown } from "@/lib/restaurant-stats";
import { fetchPlaceDetails, isGooglePlacesConfigured } from "@/lib/places/google";
import { enrichPlaceWithYelp, isYelpConfigured, type YelpEnrichment } from "@/lib/places/yelp";
import { shareRestaurant, openInMaps } from "@/lib/share";
import { openOriginalSource } from "@/lib/share-intake/open-source";
import { track } from "@/lib/analytics";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { DishCard } from "@/components/dishes/DishCard";
import { Rating } from "@/components/ui/Rating";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { SavedSourcesSheet } from "@/components/share/SavedSourcesSheet";
import { APP_NAME } from "@/constants/branding";
import { formatPrice } from "@/lib/utils";
import { ui } from "@/constants/ui";
import { hapticLight } from "@/lib/haptics";
import {
  wantToTryBookmarkLabel,
  bitesSegmentHint,
  TRY_NEXT_LABEL,
} from "@/lib/bites";

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex-1 items-center py-3">
      <Text className="text-xl font-bold text-savr-900 dark:text-savr-100">{value}</Text>
      <Text className={`text-xs text-center mt-0.5 ${ui.text.muted}`}>{label}</Text>
    </Card>
  );
}

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getRestaurant, reviews, dishes, reviewPhotos, currentUserId, follows, getUser,
    isRestaurantBookmarked, toggleRestaurantBookmark, bookmarks,
  } = useAppStore();
  const restaurant = getRestaurant(id!);
  const [googlePhotos, setGooglePhotos] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [yelp, setYelp] = useState<YelpEnrichment | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const myBookmark = useMemo(
    () =>
      bookmarks.find(
        (b) =>
          b.restaurantId === id ||
          (restaurant?.googlePlaceId && b.googlePlaceId === restaurant.googlePlaceId),
      ) ?? null,
    [bookmarks, id, restaurant?.googlePlaceId],
  );
  const savedSources = myBookmark?.sources ?? [];

  const restReviews = reviews.filter((r) => r.restaurantId === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const restDishes = dishes.filter((d) => d.restaurantId === id);
  const myReview = restReviews.find((r) => r.userId === currentUserId);
  const stats = getRestaurantRatingsBreakdown(id!, currentUserId, reviews, follows, getUser);
  const bookmarked = restaurant ? isRestaurantBookmarked(restaurant) : false;

  const reviewPhotoUrls = useMemo(() => {
    const ids = new Set(restReviews.map((r) => r.id));
    return reviewPhotos.filter((p) => ids.has(p.reviewId)).map((p) => p.url);
  }, [restReviews, reviewPhotos]);

  const galleryPhotos = useMemo(() => {
    const urls = [...googlePhotos, ...reviewPhotoUrls];
    if (urls.length === 0 && restaurant?.imageUrl) return [restaurant.imageUrl];
    return [...new Set(urls)];
  }, [googlePhotos, reviewPhotoUrls, restaurant?.imageUrl]);

  useEffect(() => {
    if (!restaurant?.googlePlaceId || !isGooglePlacesConfigured()) return;
    fetchPlaceDetails(restaurant.googlePlaceId).then(({ photos }) => {
      setGooglePhotos(photos);
    });
  }, [restaurant?.googlePlaceId]);

  useEffect(() => {
    if (!restaurant || !isYelpConfigured()) return;
    if (restaurant.latitude == null || restaurant.longitude == null) return;
    let cancelled = false;
    void enrichPlaceWithYelp({
      googlePlaceId: restaurant.googlePlaceId ?? restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      city: restaurant.city,
      cuisine: restaurant.cuisine,
      priceLevel: restaurant.priceLevel,
      imageUrl: restaurant.imageUrl,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    }).then((result) => {
      if (!cancelled) setYelp(result);
    });
    return () => {
      cancelled = true;
    };
  }, [restaurant]);

  if (!restaurant) {
    return (
      <View className="flex-1 items-center justify-center bg-savr-50 dark:bg-savr-950">
        <Text className={ui.text.muted}>Restaurant not found.</Text>
      </View>
    );
  }

  const heroImage = galleryPhotos[galleryIndex] ?? galleryPhotos[0];
  const hasCoords = restaurant.latitude != null && restaurant.longitude != null;

  const handleBookmark = async () => {
    hapticLight();
    const result = await toggleRestaurantBookmark(restaurant);
    if (!result.ok && result.error) Alert.alert(TRY_NEXT_LABEL, result.error);
  };

  return (
    <>
    <ScrollView className="flex-1 bg-savr-50 dark:bg-savr-950" contentContainerClassName="pb-6 gap-4">
      {heroImage ? (
        <Pressable
          onPress={() => galleryPhotos.length > 1 && setGalleryIndex((i) => (i + 1) % galleryPhotos.length)}
        >
          <Image source={{ uri: heroImage }} style={{ width: "100%", height: 220 }} contentFit="cover" transition={200} />
          {galleryPhotos.length > 1 && (
            <View className="absolute bottom-3 right-3 bg-black/50 px-2 py-1 rounded-full">
              <Text className="text-white text-xs">{galleryIndex + 1} / {galleryPhotos.length}</Text>
            </View>
          )}
        </Pressable>
      ) : (
        <View className="h-[220px] bg-savr-100 dark:bg-savr-800 items-center justify-center">
          <Ionicons name="restaurant" size={48} color="#FF8559" />
        </View>
      )}
      <View className="px-4 gap-4">
        <View>
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-savr-900 dark:text-savr-100">{restaurant.name}</Text>
              <Text className="text-sm text-savr-350 dark:text-savr-300">{restaurant.cuisine}</Text>
            </View>
            <View className="flex-row items-center">
              <Pressable
                onPress={handleBookmark}
                className="p-2"
                accessibilityLabel={wantToTryBookmarkLabel(bookmarked)}
                accessibilityHint={bitesSegmentHint()}
              >
                <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={24} color="#FF8559" />
              </Pressable>
              <Pressable
                onPress={() => shareRestaurant(restaurant.id, restaurant.name, restaurant.cuisine, restaurant.city, stats.overallAvg ?? undefined)}
                className="p-2"
              >
                <Ionicons name="share-outline" size={24} color="#FF8559" />
              </Pressable>
            </View>
          </View>
          <Text className="text-sm text-savr-500 dark:text-savr-400 mt-1">{restaurant.address}, {restaurant.city}</Text>
          <View className="flex-row items-center gap-2 mt-2 flex-wrap">
            <Text className="text-sm text-savr-350 dark:text-savr-300">{formatPrice(restaurant.priceLevel)}</Text>
            {stats.overallAvg != null && <Rating value={stats.overallAvg} size="sm" />}
            {yelp?.rating != null ? (
              <Text className={`text-sm ${ui.text.muted}`}>
                Yelp {yelp.rating.toFixed(1)}
                {yelp.reviewCount != null ? ` · ${yelp.reviewCount} reviews` : ""}
              </Text>
            ) : null}
          </View>
          {hasCoords && (
            <Pressable
              onPress={() => openInMaps(restaurant.latitude!, restaurant.longitude!, restaurant.name)}
              className="flex-row items-center gap-1.5 mt-2"
            >
              <Ionicons name="navigate-outline" size={16} color="#FF8559" />
              <Text className="text-sm text-savr-350 dark:text-savr-300 font-medium">Open in Maps</Text>
            </Pressable>
          )}
        </View>

        {(stats.yourRating != null || stats.friendsAvg != null || stats.overallAvg != null) && (
          <View className="flex-row gap-2">
            <StatBox label="Your rating" value={stats.yourRating != null ? stats.yourRating.toFixed(1) : "—"} />
            <StatBox label="Friends avg" value={stats.friendsAvg != null ? stats.friendsAvg.toFixed(1) : "—"} />
            <StatBox label={`${APP_NAME} avg`} value={stats.overallAvg != null ? stats.overallAvg.toFixed(1) : "—"} />
          </View>
        )}

        {savedSources.length > 0 && myBookmark ? (
          <Card className="gap-2 py-4">
            <Text className={`text-base font-bold ${ui.text.primary}`}>Why you saved this</Text>
            {savedSources.length === 1 ? (
              <View className="gap-1">
                <Text className={`text-xs font-semibold ${ui.text.muted}`}>
                  Saved from {savedSources[0].sourcePlatform}
                </Text>
                {savedSources[0].title ? (
                  <Text className={`text-sm ${ui.text.secondary}`} numberOfLines={2}>
                    {savedSources[0].title}
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => {
                    track("original_source_opened", {
                      platform: savedSources[0].sourcePlatform,
                    });
                    void openOriginalSource(savedSources[0].sourceUrl);
                  }}
                  className="flex-row items-center gap-1.5 mt-1"
                >
                  <Ionicons name="open-outline" size={16} color="#FF8559" />
                  <Text className="text-sm font-semibold text-savr-500">View Original</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setSourcesOpen(true)}>
                <Text className="text-sm font-semibold text-savr-500">
                  {savedSources.length} inspiration links
                </Text>
              </Pressable>
            )}
          </Card>
        ) : null}

        {myReview ? (
          <Button
            label="Edit your review"
            variant="secondary"
            onPress={() => router.push(`/add-review?reviewId=${myReview.id}`)}
          />
        ) : (
          <Button label="Rate this spot" onPress={() => router.push(`/add-bite?restaurantId=${id}`)} />
        )}

        {galleryPhotos.length > 1 && (
          <View className="gap-2">
            <Text className="font-semibold text-savr-900 dark:text-savr-100">Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              {galleryPhotos.map((url, i) => (
                <Pressable key={url} onPress={() => setGalleryIndex(i)}>
                  <Image
                    source={{ uri: url }}
                    style={{ width: 140, height: 100, borderRadius: 12, borderWidth: galleryIndex === i ? 2 : 0, borderColor: "#FF8559" }}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {stats.friendsWhoRated.length > 0 && (
          <View className="gap-2">
            <Text className="font-semibold text-savr-900 dark:text-savr-100">Friends who rated this</Text>
            {stats.friendsWhoRated.map(({ user, rating }) => (
              <Pressable key={user.id} onPress={() => router.push(`/user/${user.id}`)} className="flex-row items-center gap-3">
                <Avatar name={user.displayName} src={user.avatarUrl} size="sm" />
                <Text className="flex-1 text-savr-800 dark:text-savr-200">{user.displayName}</Text>
                <Text className="font-semibold text-savr-350 dark:text-savr-300">{rating.toFixed(1)}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {restDishes.length > 0 && (
          <View className="gap-2">
            <Text className="font-semibold text-savr-900 dark:text-savr-100">Top Dishes</Text>
            {restDishes.sort((a, b) => b.rating - a.rating).slice(0, 5).map((d) => (
              <DishCard key={d.id} dish={d} restaurant={restaurant} />
            ))}
          </View>
        )}
        <View className="gap-2">
          <Text className="font-semibold text-savr-900 dark:text-savr-100">Reviews ({restReviews.length})</Text>
          {restReviews.length === 0 ? (
            <EmptyState
              icon="chatbubble-outline"
              title="No reviews yet"
              description={`Be the first on ${APP_NAME} to rate ${restaurant.name}.`}
              actionLabel="Write a Review"
              onAction={() => router.push(`/add-bite?restaurantId=${id}`)}
            />
          ) : (
            restReviews.map((r) => (
              <ReviewCard key={r.id} review={r} showRestaurant={false} showEngagement={false} />
            ))
          )}
        </View>
      </View>
    </ScrollView>
    {myBookmark ? (
      <SavedSourcesSheet
        visible={sourcesOpen}
        bookmarkId={myBookmark.id}
        sources={savedSources}
        onClose={() => setSourcesOpen(false)}
      />
    ) : null}
    </>
  );
}

