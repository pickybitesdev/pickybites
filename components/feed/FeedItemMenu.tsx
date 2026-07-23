import { Modal, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ui } from "@/constants/ui";

export type FeedMenuAction = {
  key: string;
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

export function FeedItemMenu({
  visible,
  title,
  actions,
  onClose,
}: {
  visible: boolean;
  title?: string;
  actions: FeedMenuAction[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <View
          className="bg-white dark:bg-savr-900 rounded-t-3xl px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          testID="feed-item-menu"
        >
          <View className="items-center pb-3">
            <View className="w-10 h-1 rounded-full bg-savr-200" />
          </View>
          {title ? (
            <Text className={`text-sm font-semibold mb-2 px-1 ${ui.text.secondary}`}>{title}</Text>
          ) : null}
          {actions.map((action) => (
            <Pressable
              key={action.key}
              onPress={() => {
                onClose();
                action.onPress();
              }}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              className="py-3.5 px-2 border-b border-savr-100 dark:border-savr-800"
            >
              <Text
                className={`text-base font-medium ${
                  action.destructive ? "text-red-500" : ui.text.primary
                }`}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={onClose} className="py-4 items-center" accessibilityLabel="Cancel">
            <Text className={`text-base font-semibold ${ui.text.secondary}`}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
