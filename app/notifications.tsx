import { useEffect, useRef } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelative } from "@/lib/utils";
import { ui } from "@/constants/ui";

const iconForType = {
  like: "heart" as const,
  comment: "chatbubble" as const,
  follow: "person-add" as const,
};

export default function NotificationsScreen() {
  const notifications = useAppStore((s) => s.notifications);
  const getUser = useAppStore((s) => s.getUser);
  const getReview = useAppStore((s) => s.getReview);
  const markedRead = useRef(false);

  useEffect(() => {
    if (markedRead.current) return;
    markedRead.current = true;
    void useAppStore.getState().markNotificationsRead();
  }, []);

  return (
    <ScrollView className="flex-1 bg-savr-50 dark:bg-savr-950" contentContainerClassName="px-4 pb-6 gap-3">
      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No notifications yet"
          description="Likes, comments, and new followers will show up here."
        />
      ) : (
        notifications.map((n) => {
          const actor = n.actorId ? getUser(n.actorId) : null;
          return (
            <Pressable
              key={n.id}
              onPress={() => {
                if (n.reviewId) {
                  const review = getReview(n.reviewId);
                  if (review) router.push(`/restaurant/${review.restaurantId}`);
                } else if (n.actorId) router.push(`/user/${n.actorId}`);
              }}
            >
              <Card className={`flex-row items-start gap-3 ${n.read ? "opacity-80" : "border-savr-400"}`}>
                <View className="w-10 h-10 rounded-full bg-savr-100 dark:bg-savr-800 items-center justify-center">
                  <Ionicons name={iconForType[n.type]} size={18} color="#FF8559" />
                </View>
                <View className="flex-1">
                  <Text className="text-savr-900 dark:text-savr-100">{n.message}</Text>
                  {actor ? (
                    <Text className={`text-xs mt-0.5 ${ui.text.muted}`}>@{actor.username}</Text>
                  ) : null}
                  <Text className={`text-xs mt-1 ${ui.text.faint}`}>{formatRelative(n.createdAt)}</Text>
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}
