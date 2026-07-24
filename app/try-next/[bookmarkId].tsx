import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SavedSourcesSheet } from "@/components/share/SavedSourcesSheet";
import { openOriginalSource } from "@/lib/share-intake/open-source";
import { track } from "@/lib/analytics";
import { ui } from "@/constants/ui";
import { brandColors } from "@/constants/branding";

function platformLabel(p: string): string {
  const map: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    facebook: "Facebook",
    google_maps: "Google Maps",
    yelp: "Yelp",
    web: "Web",
    unknown: "Link",
  };
  return map[p] ?? "Link";
}

export default function TryNextBookmarkDetail() {
  const { bookmarkId } = useLocalSearchParams<{ bookmarkId: string }>();
  const id = Array.isArray(bookmarkId) ? bookmarkId[0] : bookmarkId;
  const bookmarks = useAppStore((s) => s.bookmarks);
  const bookmark = useMemo(() => bookmarks.find((b) => b.id === id), [bookmarks, id]);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  if (!bookmark) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${ui.screen}`}>
        <Text className={ui.text.muted}>Saved spot not found</Text>
        <Button
          label="View Try Next"
          className="mt-4"
          onPress={() =>
            router.replace({ pathname: "/(tabs)/bites", params: { segment: "want_to_try" } })
          }
        />
      </SafeAreaView>
    );
  }

  const sources = bookmark.sources ?? [];
  const primary = sources[0];

  return (
    <SafeAreaView className={`flex-1 ${ui.screen}`} edges={["bottom"]}>
      <ScrollView contentContainerClassName="px-4 pb-10 gap-4">
        <Card className="gap-3 py-4">
          {bookmark.placeImageUrl ? (
            <Image
              source={{ uri: bookmark.placeImageUrl }}
              style={{ width: "100%", height: 160, borderRadius: 16 }}
            />
          ) : null}
          <Text className={`text-2xl font-bold ${ui.text.primary}`}>{bookmark.placeName}</Text>
          {bookmark.resolutionStatus === "link_only" ? (
            <Text className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              Restaurant not linked
            </Text>
          ) : null}
          <Text className={`text-sm ${ui.text.muted}`}>
            {[bookmark.placeCuisine, bookmark.placeCity].filter(Boolean).join(" · ")}
          </Text>
          {bookmark.reasonSaved ? (
            <Text className={`text-sm italic ${ui.text.secondary}`}>
              &ldquo;{bookmark.reasonSaved}&rdquo;
            </Text>
          ) : null}
        </Card>

        {sources.length > 0 ? (
          <Card className="gap-3 py-4">
            <Text className={`text-base font-bold ${ui.text.primary}`}>Why you saved this</Text>
            {sources.length === 1 && primary ? (
              <View className="gap-2">
                <Text className={`text-xs font-semibold ${ui.text.muted}`}>
                  Saved from {platformLabel(primary.sourcePlatform)}
                </Text>
                {primary.title ? (
                  <Text className={`text-sm ${ui.text.secondary}`} numberOfLines={2}>
                    {primary.title}
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => {
                    track("original_source_opened", { platform: primary.sourcePlatform });
                    void openOriginalSource(primary.sourceUrl);
                  }}
                  className="flex-row items-center gap-2"
                >
                  <Ionicons name="open-outline" size={18} color={brandColors.primary} />
                  <Text className="text-sm font-semibold text-savr-500">View Original</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setSourcesOpen(true)}>
                <Text className="text-sm font-semibold text-savr-500">
                  {sources.length} inspiration links
                </Text>
              </Pressable>
            )}
          </Card>
        ) : null}

        <Button
          label="Link Restaurant"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: "/(tabs)/discover" })
          }
        />
        <Button
          label="Back to Try Next"
          onPress={() =>
            router.replace({ pathname: "/(tabs)/bites", params: { segment: "want_to_try" } })
          }
        />
      </ScrollView>

      <SavedSourcesSheet
        visible={sourcesOpen}
        bookmarkId={bookmark.id}
        sources={sources}
        onClose={() => setSourcesOpen(false)}
      />
    </SafeAreaView>
  );
}
