import { useCallback, useRef, useState } from "react";
import { View, FlatList, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import { useFeed } from "@/hooks/useFeed";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { FeedFilterChips } from "@/components/feed/FeedFilterChips";
import { FeedCustomizeSheet } from "@/components/feed/FeedCustomizeSheet";
import { FeedEmptyState } from "@/components/feed/FeedEmptyState";
import { FeedEndState } from "@/components/feed/FeedEndState";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { FeedItemRenderer } from "@/components/feed/FeedItemRenderer";
import { GettingStartedCard } from "@/components/home/GettingStartedCard";
import type { FeedItem } from "@/lib/feed/types";
import { countActiveFeedFilters, hasActiveFeedFilters } from "@/lib/feed-preferences";
import { TAB_SCROLL_BOTTOM_PADDING } from "@/lib/tab-bar";
import { useThemedColors } from "@/lib/useThemedColors";
import { ui } from "@/constants/ui";
import { useAppStore } from "@/store/useAppStore";

export default function FeedScreen() {
  const colors = useThemedColors();
  const listRef = useRef<FlatList<FeedItem>>(null);
  useScrollToTop(listRef as never);

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const myReviewCount = useAppStore(
    (s) => s.reviews.filter((r) => r.userId === s.currentUserId).length,
  );

  const feed = useFeed();
  const activeFilterCount = countActiveFeedFilters(feed.prefs);
  const showFilterChips = hasActiveFeedFilters(feed.prefs);
  const compactHeader = feed.followingCount > 0 || myReviewCount >= 1;

  const onRefresh = useCallback(() => {
    void feed.refresh();
  }, [feed]);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => (
      <FeedItemRenderer
        item={item}
        isBookmarked={(restaurant) => feed.isBookmarked(restaurant.id)}
        onSaveRestaurant={(restaurant) => {
          void feed.toggleRestaurantBookmark(restaurant);
        }}
        onHideRestaurant={(id) => {
          void feed.hideRestaurant(id);
        }}
        onFewerLikeCuisine={(cuisine) => {
          void feed.showFewerLikeCuisine(cuisine);
        }}
        onHidePost={(id) => {
          void feed.hidePost(id);
        }}
        onFewerFromPerson={(id) => {
          void feed.showFewerFromUser(id);
        }}
        onUnfollow={(id) => {
          void feed.unfollowUser(id);
        }}
        onDeleteReview={async (id) => {
          const result = await feed.deleteReview(id);
          if (result && "error" in result) Alert.alert("Could not delete", result.error);
        }}
        whyReason={feed.whyReason}
        showBestMatchHint={feed.prefs.sort === "best_match"}
      />
    ),
    [feed],
  );

  const listHeader = (
    <View className="gap-3 pb-2">
      <FeedHeader
        scope={feed.scope}
        onScopeChange={feed.setScope}
        onCustomize={() => setCustomizeOpen(true)}
        activeFilterCount={activeFilterCount}
        compact={compactHeader}
      />
      {showFilterChips ? (
        <FeedFilterChips
          prefs={feed.prefs}
          onClear={() => {
            void feed.resetPreferences();
          }}
          onPressChip={() => setCustomizeOpen(true)}
        />
      ) : null}
      <View className="px-4">
        <GettingStartedCard
          displayName={feed.user?.displayName ?? "Foodie"}
          hasTasteQuiz={feed.user?.hasCompletedTasteQuiz ?? false}
          reviewCount={myReviewCount}
          followingCount={feed.followingCount}
        />
      </View>
    </View>
  );

  const showSkeleton = feed.isLoading && feed.items.length === 0;
  const showEmpty = !showSkeleton && feed.items.length === 0 && feed.emptyKind;

  return (
    <SafeAreaView className={`flex-1 ${ui.screen}`} edges={["top"]} testID="feed-screen">
      <FlatList
        ref={listRef}
        data={showSkeleton ? [] : feed.items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          showSkeleton ? (
            <FeedSkeleton />
          ) : showEmpty ? (
            <FeedEmptyState
              kind={feed.emptyKind!}
              onFindFriends={() => router.push("/friends")}
              onDiscover={() => router.push("/(tabs)/discover")}
              onResetFeed={() => {
                void feed.resetPreferences();
              }}
              onAdjustPreferences={() => setCustomizeOpen(true)}
              onRetry={() => void feed.refresh()}
            />
          ) : null
        }
        ListFooterComponent={
          !showSkeleton && !showEmpty && feed.items.length > 0 && !feed.hasMore ? (
            <FeedEndState />
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{
          paddingBottom: TAB_SCROLL_BOTTOM_PADDING,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.spinner}
          />
        }
        onEndReached={() => {
          if (!showSkeleton && feed.hasMore) feed.loadMore();
        }}
        onEndReachedThreshold={0.4}
        testID="feed-list"
      />

      <FeedCustomizeSheet
        visible={customizeOpen}
        prefs={feed.prefs}
        locationAvailable={feed.locationAvailable}
        onClose={() => setCustomizeOpen(false)}
        onApply={(next) => {
          void feed.applyPreferences(next);
        }}
      />
    </SafeAreaView>
  );
}
