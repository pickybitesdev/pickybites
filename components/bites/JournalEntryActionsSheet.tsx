import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { cn } from "@/lib/utils";

type SheetStep = "menu" | "confirm_delete";

type MenuRow = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

export function JournalEntryActionsSheet({
  visible,
  restaurantName,
  subtitle,
  onClose,
  onViewDetails,
  onEdit,
  onDelete,
}: {
  visible: boolean;
  restaurantName: string;
  subtitle?: string;
  onClose: () => void;
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();
  const [step, setStep] = useState<SheetStep>("menu");

  useEffect(() => {
    if (visible) setStep("menu");
  }, [visible]);

  const handleClose = () => {
    setStep("menu");
    onClose();
  };

  const menuRows: MenuRow[] = [
    {
      key: "view",
      label: "View details",
      icon: "open-outline",
      onPress: () => {
        handleClose();
        onViewDetails();
      },
    },
    {
      key: "edit",
      label: "Edit Bite",
      icon: "create-outline",
      onPress: () => {
        handleClose();
        onEdit();
      },
    },
    {
      key: "delete",
      label: "Delete Bite",
      icon: "trash-outline",
      destructive: true,
      onPress: () => setStep("confirm_delete"),
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/40"
          onPress={handleClose}
          accessibilityLabel="Dismiss menu"
        />
        <View
          className="bg-white dark:bg-savr-900 rounded-t-3xl px-5"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          testID="journal-entry-actions-sheet"
        >
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-savr-200 dark:bg-savr-700" />
          </View>

          {step === "menu" ? (
            <>
              <View className="pb-4 gap-0.5">
                <Text className={`text-lg font-bold ${ui.text.primary}`} numberOfLines={2}>
                  {restaurantName}
                </Text>
                {subtitle ? (
                  <Text className={`text-sm ${ui.text.muted}`} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              <View className="gap-1 pb-2">
                {menuRows.map((row) => (
                  <Pressable
                    key={row.key}
                    onPress={row.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={row.label}
                    className={cn(
                      "flex-row items-center gap-3 rounded-2xl px-3 py-3.5",
                      row.destructive ? "" : "active:bg-savr-50 dark:active:bg-savr-800",
                    )}
                  >
                    <Ionicons
                      name={row.icon}
                      size={22}
                      color={row.destructive ? colors.danger : colors.icon}
                    />
                    <Text
                      className={`text-base font-medium flex-1 ${
                        row.destructive ? "text-red-500" : ui.text.primary
                      }`}
                    >
                      {row.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} />
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={handleClose}
                className={cn("mt-1 rounded-2xl py-3.5 items-center", ui.surface.inset)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text className={`text-base font-semibold ${ui.text.secondary}`}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View className="pb-4 gap-2">
                <Text className={`text-lg font-bold ${ui.text.primary}`}>Delete this Bite?</Text>
                <Text className={`text-sm leading-5 ${ui.text.secondary}`}>
                  This removes your review of {restaurantName}. You can&apos;t undo this.
                </Text>
              </View>

              <View className="gap-2 pb-2">
                <Pressable
                  onPress={() => {
                    handleClose();
                    onDelete();
                  }}
                  className="rounded-2xl py-3.5 items-center bg-red-500"
                  accessibilityRole="button"
                  accessibilityLabel="Confirm delete"
                >
                  <Text className="text-base font-semibold text-white">Delete Bite</Text>
                </Pressable>
                <Pressable
                  onPress={() => setStep("menu")}
                  className={cn("rounded-2xl py-3.5 items-center", ui.surface.inset)}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Text className={`text-base font-semibold ${ui.text.secondary}`}>Go back</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
