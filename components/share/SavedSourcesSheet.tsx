import { Modal, View, Text, Pressable, ScrollView, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SavedItemSource } from "@/lib/types";
import { openOriginalSource } from "@/lib/share-intake/open-source";
import { useAppStore } from "@/store/useAppStore";
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
    restaurant_website: "Website",
    web: "Web",
    unknown: "Link",
  };
  return map[p] ?? "Link";
}

export function SavedSourcesSheet({
  visible,
  bookmarkId,
  sources,
  onClose,
}: {
  visible: boolean;
  bookmarkId: string;
  sources: SavedItemSource[];
  onClose: () => void;
}) {
  const removeSavedSource = useAppStore((s) => s.removeSavedSource);

  const remove = (source: SavedItemSource) => {
    Alert.alert("Remove link?", "This won’t delete the restaurant from Try Next.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void removeSavedSource(source.id, bookmarkId);
          track("share_source_removed", { platform: source.sourcePlatform });
          if (sources.length <= 1) onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <View
          className={`rounded-t-3xl max-h-[70%] ${ui.surface.card}`}
          style={{ paddingBottom: 24 }}
        >
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-savr-200 dark:bg-savr-700" />
          </View>
          <Text className={`text-lg font-bold px-4 pb-3 ${ui.text.primary}`}>
            Why you saved this
          </Text>
          <ScrollView>
            {sources.map((source) => (
              <View
                key={source.id}
                className="flex-row gap-3 px-4 py-3 border-b border-savr-100 dark:border-savr-800"
              >
                {source.thumbnailUrl ? (
                  <Image
                    source={{ uri: source.thumbnailUrl }}
                    style={{ width: 48, height: 48, borderRadius: 10 }}
                  />
                ) : (
                  <View
                    className={`w-12 h-12 rounded-[10px] items-center justify-center ${ui.surface.muted}`}
                  >
                    <Ionicons name="link-outline" size={20} color={brandColors.primary} />
                  </View>
                )}
                <View className="flex-1 gap-0.5">
                  <Text className={`text-xs font-semibold ${ui.text.muted}`}>
                    {platformLabel(source.sourcePlatform)}
                  </Text>
                  <Text className={`text-sm font-medium ${ui.text.primary}`} numberOfLines={2}>
                    {source.title || source.sourceUrl}
                  </Text>
                  <Text className={`text-[10px] ${ui.text.faint}`}>
                    {new Date(source.createdAt).toLocaleDateString()}
                  </Text>
                  <View className="flex-row gap-3 mt-1">
                    <Pressable
                      onPress={() => {
                        track("original_source_opened", { platform: source.sourcePlatform });
                        void openOriginalSource(source.sourceUrl);
                      }}
                    >
                      <Text className="text-sm font-semibold text-savr-500">Open Original</Text>
                    </Pressable>
                    <Pressable onPress={() => remove(source)}>
                      <Text className="text-sm font-semibold text-red-500">Remove Link</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
