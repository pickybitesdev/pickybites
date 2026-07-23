import { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { FeedFriendReviewItem } from "@/lib/feed/types";
import { formatRelative } from "@/lib/utils";
import { getReviewOverallRating } from "@/lib/review-scores";
import { Avatar } from "@/components/ui/Avatar";
import { Tag } from "@/components/ui/Tag";
import { FeedItemMenu } from "@/components/feed/FeedItemMenu";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";
import { wantToTryBookmarkLabel, bitesSegmentHint } from "@/lib/bites";

export function FeedFriendReviewCard({
  item,
  isBookmarked,
  onSave,
  onHidePost,
  onFewerFromPerson,
  onUnfollow,
  onEdit,
  onDelete,
  showBestMatchHint = false,
}: {
  item: FeedFriendReviewItem;
  isBookmarked?: boolean;
  onSave: () => void;
  onHidePost: () => void;
  onFewerFromPerson: () => void;
  onUnfollow: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** When Feed sort is Best match — explain why order may differ. */
  showBestMatchHint?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rating = getReviewOverallRating(item.review);
  const text = item.review.text?.trim() ?? "";
  const openReview = () => router.push(`/bite/${item.review.id}`);
  const openRestaurant = () => router.push(`/restaurant/${item.restaurant.id}`);

  const friendActions = [
    { key: "hide", label: "Hide this post", onPress: onHidePost },
    { key: "fewer", label: "Show fewer posts from this person", onPress: onFewerFromPerson },
    ...(item.isOwn
      ? []
      : [{ key: "unfollow", label: "Unfollow", destructive: true as const, onPress: onUnfollow }]),
    ...(item.isOwn && onEdit
      ? [{ key: "edit", label: "Edit", onPress: onEdit }]
      : []),
    ...(item.isOwn && onDelete
      ? [
          {
            key: "delete",
            label: "Delete",
            destructive: true as const,
            onPress: () => {
              Alert.alert("Delete review?", "This cannot be undone.", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: onDelete },
              ]);
            },
          },
        ]
      : []),
  ];

  const handleSave = () => {
    onSave();
  };

  return (
    <View
      className="mx-4 rounded-2xl overflow-hidden border border-savr-100 dark:border-savr-800 bg-white dark:bg-savr-900"
      testID="feed-friend-review-card"
    >
      <View className="flex-row items-center gap-2.5 px-3 pt-3 pb-2">
        <Pressable
          onPress={() => router.push(`/user/${item.author.id}`)}
          className="flex-row items-center gap-2.5 flex-1"
          accessibilityLabel={`Open ${item.author.displayName} profile`}
        >
          <Avatar src={item.author.avatarUrl} name={item.author.displayName} size="md" />
          <View className="flex-1">
            <Text className={`text-sm font-semibold ${ui.text.primary}`} numberOfLines={1}>
              {item.isOwn ? "Your review" : item.author.displayName}
            </Text>
            <Text className={`text-[11px] ${ui.text.muted}`}>
              {formatRelative(item.review.createdAt)}
              {showBestMatchHint && !item.isOwn ? " · Strong taste match" : ""}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityLabel="Post options"
          hitSlop={8}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={brandColors.iconInactive} />
        </Pressable>
      </View>

      <Pressable
        onPress={openReview}
        accessibilityRole="button"
        accessibilityLabel="Open review"
        testID="feed-friend-photo"
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: "100%", aspectRatio: 16 / 9 }}
            contentFit="cover"
          />
        ) : (
          <View className="w-full aspect-[16/9] items-center justify-center bg-savr-100">
            <Ionicons name="restaurant" size={28} color={brandColors.primary} />
          </View>
        )}
      </Pressable>

      <View className="p-3 gap-2">
        <View className="flex-row items-start gap-2">
          <Pressable
            onPress={openRestaurant}
            className="flex-1 gap-0.5 min-w-0"
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.restaurant.name}`}
            testID="feed-friend-restaurant"
          >
            <Text className={`text-[15px] font-bold ${ui.text.primary}`} numberOfLines={1}>
              {item.restaurant.name}
            </Text>
            <Text className={`text-xs ${ui.text.secondary}`}>
              {item.restaurant.cuisine} · {item.restaurant.city}
              {` · ★ ${rating.toFixed(1)}`}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            hitSlop={8}
            accessibilityLabel={wantToTryBookmarkLabel(!!isBookmarked)}
            accessibilityHint={bitesSegmentHint("want_to_try")}
            className="w-9 h-9 items-center justify-center -mt-0.5"
            testID="feed-friend-bookmark"
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isBookmarked ? brandColors.primary : brandColors.iconInactive}
            />
          </Pressable>
        </View>

        {text ? (
          <Pressable onPress={openReview} accessibilityRole="button" accessibilityLabel="Open review caption">
            <Text
              className={`text-sm leading-5 ${ui.text.secondary}`}
              numberOfLines={3}
              testID="feed-friend-caption"
            >
              {text}
            </Text>
            {text.length > 120 ? (
              <Text style={{ color: brandColors.primary }} className="text-xs font-semibold mt-1">
                More
              </Text>
            ) : null}
          </Pressable>
        ) : null}

        {item.review.tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5" accessibilityLabel="Review tags">
            {item.review.tags.slice(0, 3).map((t) => (
              <Tag key={t} label={t} />
            ))}
          </View>
        ) : null}
      </View>

      <FeedItemMenu
        visible={menuOpen}
        title={item.isOwn ? "Your review" : "Friend activity"}
        onClose={() => setMenuOpen(false)}
        actions={friendActions}
      />
    </View>
  );
}
