import { useRef, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  Share,
  Alert,
  Pressable,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { goBackOr } from "@/lib/navigation";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import {
  calculateFoodWrappedSummary,
  getDefaultWrappedPeriod,
  buildWrappedShareMessage,
  type WrappedPeriod,
  type WrappedPeriodType,
} from "@/lib/food-wrapped";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  renderWrappedCard,
  WRAPPED_CARD_COUNT,
} from "@/components/wrapped/WrappedCards";
import { WrappedShareCard } from "@/components/wrapped/WrappedShareCard";
import { hapticLight } from "@/lib/haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.72, 620);

export default function WrappedScreen() {
  const { currentUserId, users, reviews, dishes, restaurants } = useAppStore();
  const user = users.find((u) => u.id === currentUserId);
  const shareRef = useRef<View>(null);
  const listRef = useRef<FlatList>(null);

  const [periodType, setPeriodType] = useState<WrappedPeriodType>("year");
  const [period, setPeriod] = useState<WrappedPeriod>(getDefaultWrappedPeriod());
  const [activeIndex, setActiveIndex] = useState(0);

  const activePeriod = useMemo<WrappedPeriod>(
    () => ({ ...period, type: periodType }),
    [period, periodType],
  );

  const summary = useMemo(
    () =>
      currentUserId
        ? calculateFoodWrappedSummary(currentUserId, activePeriod, reviews, dishes, restaurants)
        : null,
    [currentUserId, activePeriod, reviews, dishes, restaurants],
  );

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }, []);

  const shiftPeriod = (delta: number) => {
    if (periodType === "all-time") return;
    if (periodType === "year") {
      setPeriod((p) => ({ ...p, year: p.year + delta }));
      return;
    }
    const d = new Date(period.year, period.month - 1 + delta, 1);
    setPeriod({ type: "month", year: d.getFullYear(), month: d.getMonth() + 1 });
  };

  const shareText = () => {
    if (!summary || !user) return;
    Share.share({ message: buildWrappedShareMessage(summary, user.displayName) });
  };

  const shareImage = async () => {
    if (!summary || !user) return;
    try {
      const uri = await captureRef(shareRef, { format: "png", quality: 1 });
      await Share.share({ url: uri, message: buildWrappedShareMessage(summary, user.displayName) });
    } catch {
      Alert.alert("Share", "Could not create share image. Sharing text instead.");
      shareText();
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#141010" }} edges={["top", "bottom"]}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable onPress={() => goBackOr("/(tabs)/profile")} hitSlop={12}>
            <Ionicons name="close" size={28} color="#F5F0EB" />
          </Pressable>
          <Text style={{ color: "#F5F0EB", fontSize: 16, fontWeight: "700" }}>Food Wrapped</Text>
          <Pressable onPress={shareImage} hitSlop={12}>
            <Ionicons name="share-outline" size={24} color="#F5F0EB" />
          </Pressable>
        </View>

        <SegmentedControl
          options={[
            { value: "year" as const, label: "Year" },
            { value: "month" as const, label: "Month" },
            { value: "all-time" as const, label: "All Time" },
          ]}
          value={periodType}
          onChange={(v) => {
            hapticLight();
            setPeriodType(v);
            setActiveIndex(0);
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
          }}
        />

        {periodType !== "all-time" ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <Pressable onPress={() => shiftPeriod(-1)}>
              <Ionicons name="chevron-back" size={22} color="#F5F0EB" />
            </Pressable>
            <Text style={{ color: "#F5F0EB", fontSize: 15, fontWeight: "600", minWidth: 120, textAlign: "center" }}>
              {summary?.periodLabel ?? activePeriod.year}
            </Text>
            <Pressable onPress={() => shiftPeriod(1)}>
              <Ionicons name="chevron-forward" size={22} color="#F5F0EB" />
            </Pressable>
          </View>
        ) : null}
      </View>

      {!summary ? (
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 16 }}>
          <EmptyState
            icon="gift-outline"
            title="No wrapped data yet"
            description={`Log reviews for this ${periodType === "month" ? "month" : periodType === "year" ? "year" : "period"} to unlock your Food Wrapped.`}
            actionLabel="Write a Review"
            onAction={() => router.push("/add-bite")}
          />
        </View>
      ) : (
        <>
          <FlatList
            ref={listRef}
            data={Array.from({ length: WRAPPED_CARD_COUNT }, (_, i) => i)}
            keyExtractor={(item) => String(item)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => (
              <View
                style={{
                  width: SCREEN_WIDTH,
                  height: CARD_HEIGHT,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <View style={{ flex: 1, borderRadius: 28, overflow: "hidden" }}>
                  {renderWrappedCard(item, summary, user.displayName)}
                </View>
              </View>
            )}
          />

          <View style={{ alignItems: "center", gap: 12, paddingVertical: 16, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {Array.from({ length: WRAPPED_CARD_COUNT }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === activeIndex ? 20 : 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: i === activeIndex ? "#F5D0A8" : "rgba(255,255,255,0.25)",
                  }}
                />
              ))}
            </View>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
              Swipe for your story · {activeIndex + 1}/{WRAPPED_CARD_COUNT}
            </Text>
            <Button label="Share Wrapped Card" onPress={shareImage} />
            <Button label="Share as Text" variant="secondary" onPress={shareText} />
          </View>
        </>
      )}

      {summary ? (
        <View style={{ position: "absolute", left: -9999, opacity: 0 }} pointerEvents="none">
          <View ref={shareRef} collapsable={false}>
            <WrappedShareCard summary={summary} displayName={user.displayName} />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
