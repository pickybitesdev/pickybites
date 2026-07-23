import { Modal, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";

export function VisitedFollowUpSheet({
  visible,
  placeName,
  canReview,
  onClose,
  onAddBite,
}: {
  visible: boolean;
  placeName: string;
  canReview: boolean;
  onClose: () => void;
  onAddBite: () => void;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation?.()}
          className={`rounded-t-3xl px-4 pt-3 pb-2 ${ui.surface.card}`}
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="items-center mb-3">
            <View className="w-10 h-1 rounded-full bg-savr-200 dark:bg-savr-700" />
          </View>

          <View className="flex-row items-start justify-between gap-3 mb-2">
            <View className="flex-1 gap-1">
              <Text className={`text-xl font-bold ${ui.text.primary}`}>Marked as visited</Text>
              <Text className={`text-sm ${ui.text.muted}`}>
                {placeName} moved to Try Next → Visited. Capture the meal as a Bite while it&apos;s
                fresh — that powers your Taste DNA and Food Journal.
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.iconMuted} />
            </Pressable>
          </View>

          <View className={`mt-4 rounded-2xl px-3 py-3 gap-2 ${ui.surface.muted}`}>
            <View className="flex-row items-center gap-2">
              <Ionicons name="restaurant-outline" size={18} color={colors.brand} />
              <Text className={`text-sm font-semibold ${ui.text.primary}`}>What&apos;s next</Text>
            </View>
            <Text className={`text-xs ${ui.text.muted}`}>
              Add a Bite to rate dishes, save photos, and unlock better recommendations. Find it
              anytime under Try Next → Visited if you skip for now.
            </Text>
          </View>

          <View className="gap-3 mt-5">
            {canReview ? (
              <Button label="Add a Bite" onPress={onAddBite} testID="visited-followup-add-bite" />
            ) : null}
            <Button
              label={canReview ? "Not now" : "Done"}
              variant="secondary"
              onPress={onClose}
              testID="visited-followup-dismiss"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
