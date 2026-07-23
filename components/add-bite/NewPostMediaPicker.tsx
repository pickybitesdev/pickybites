import { View, Text, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";
import { ADD_BITE_MAX_PHOTOS } from "@/lib/add-bite-draft";

export function NewPostMediaPicker({
  photoUris,
  coverPhotoIndex,
  onAddPress,
  onSelectCover,
  onRemove,
}: {
  photoUris: string[];
  coverPhotoIndex: number;
  onAddPress: () => void;
  onSelectCover: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  const empty = photoUris.length === 0;

  return (
    <View className="gap-2">
      {empty ? (
        <Pressable
          onPress={onAddPress}
          accessibilityLabel="Add photos"
          className="items-center justify-center rounded-2xl border border-dashed py-14 px-4"
          style={{
            borderColor: brandColors.border,
            backgroundColor: brandColors.surface,
            borderWidth: 1.5,
          }}
        >
          <Ionicons name="camera-outline" size={36} color={brandColors.primary} />
          <Text className={`mt-2 text-base font-semibold ${ui.text.secondary}`}>
            Add photos
          </Text>
        </Pressable>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {photoUris.map((uri, i) => (
            <Pressable
              key={`${uri}-${i}`}
              onPress={() => onSelectCover(i)}
              onLongPress={() => onRemove(i)}
              accessibilityLabel={
                coverPhotoIndex === i ? "Cover photo" : "Set as cover photo"
              }
            >
              <Image
                source={{ uri }}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 14,
                  borderWidth: coverPhotoIndex === i ? 2 : 0,
                  borderColor: brandColors.primary,
                }}
              />
            </Pressable>
          ))}
          {photoUris.length < ADD_BITE_MAX_PHOTOS ? (
            <Pressable
              onPress={onAddPress}
              accessibilityLabel="Add more photos"
              className="items-center justify-center rounded-2xl border border-dashed"
              style={{
                width: 88,
                height: 88,
                borderColor: brandColors.border,
                borderWidth: 1.5,
              }}
            >
              <Ionicons name="add" size={28} color={brandColors.primary} />
            </Pressable>
          ) : null}
        </View>
      )}
      {!empty ? (
        <Text className={`text-xs ${ui.text.muted}`}>
          Tap cover · long-press to remove · up to {ADD_BITE_MAX_PHOTOS}
        </Text>
      ) : null}
    </View>
  );
}

export function promptAddPhotos(handlers: {
  onCamera: () => void;
  onLibrary: () => void;
}) {
  Alert.alert("Add photos", undefined, [
    { text: "Camera", onPress: handlers.onCamera },
    { text: "Photo library", onPress: handlers.onLibrary },
    { text: "Cancel", style: "cancel" },
  ]);
}
