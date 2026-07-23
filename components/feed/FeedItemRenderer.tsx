import { Alert } from "react-native";
import type { FeedItem } from "@/lib/feed/types";
import { FeedRestaurantRecCard } from "@/components/feed/FeedRestaurantRecCard";
import { FeedDishRecCard } from "@/components/feed/FeedDishRecCard";
import { FeedFriendReviewCard } from "@/components/feed/FeedFriendReviewCard";
import { FeedTasteMatchCard } from "@/components/feed/FeedTasteMatchCard";
import { FeedPromptCard } from "@/components/feed/FeedPromptCard";
import type { Restaurant } from "@/lib/types";
import { router } from "expo-router";

export function FeedItemRenderer({
  item,
  isBookmarked,
  onSaveRestaurant,
  onHideRestaurant,
  onFewerLikeCuisine,
  onHidePost,
  onFewerFromPerson,
  onUnfollow,
  onDeleteReview,
  whyReason,
  showBestMatchHint = false,
}: {
  item: FeedItem;
  isBookmarked: (restaurant: Restaurant) => boolean;
  onSaveRestaurant: (restaurant: Restaurant) => void;
  onHideRestaurant: (restaurantId: string) => void;
  onFewerLikeCuisine: (cuisine: Restaurant["cuisine"]) => void;
  onHidePost: (reviewId: string) => void;
  onFewerFromPerson: (userId: string) => void;
  onUnfollow: (userId: string) => void;
  onDeleteReview: (reviewId: string) => void;
  whyReason: (item: FeedItem) => string;
  showBestMatchHint?: boolean;
}) {
  switch (item.type) {
    case "restaurant_rec":
      return (
        <FeedRestaurantRecCard
          item={item}
          isBookmarked={isBookmarked(item.restaurant)}
          onSave={() => onSaveRestaurant(item.restaurant)}
          onHideRestaurant={() => onHideRestaurant(item.restaurant.id)}
          onFewerLikeThis={() => onFewerLikeCuisine(item.restaurant.cuisine)}
          onWhy={() => Alert.alert("Why am I seeing this?", whyReason(item))}
        />
      );
    case "dish_rec":
      return (
        <FeedDishRecCard item={item} onSave={() => onSaveRestaurant(item.restaurant)} />
      );
    case "friend_review":
      return (
        <FeedFriendReviewCard
          item={item}
          isBookmarked={isBookmarked(item.restaurant)}
          onSave={() => onSaveRestaurant(item.restaurant)}
          onHidePost={() => onHidePost(item.review.id)}
          onFewerFromPerson={() => onFewerFromPerson(item.author.id)}
          onUnfollow={() => onUnfollow(item.author.id)}
          showBestMatchHint={showBestMatchHint}
          onEdit={
            item.isOwn
              ? () =>
                  router.push({
                    pathname: "/add-review",
                    params: { restaurantId: item.restaurant.id, reviewId: item.review.id },
                  })
              : undefined
          }
          onDelete={item.isOwn ? () => onDeleteReview(item.review.id) : undefined}
        />
      );
    case "taste_match_rec":
      return (
        <FeedTasteMatchCard item={item} onSave={() => onSaveRestaurant(item.restaurant)} />
      );
    case "prompt":
      return <FeedPromptCard item={item} />;
    case "friend_save":
      return null;
    default:
      return null;
  }
}
