import { useState } from "react";
import { Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, Image, Alert, View } from "react-native";
import { router } from "expo-router";
import { goBackOr } from "@/lib/navigation";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function EditProfileScreen() {
  const { users, currentUserId, updateProfile } = useAppStore();
  const user = users.find((u) => u.id === currentUserId);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const save = async () => {
    setLoading(true);
    const result = await updateProfile({
      displayName, username, city, bio,
      ...(avatarUri ? { avatarLocalUri: avatarUri } : {}),
    });
    setLoading(false);
    if (!result.ok) Alert.alert("Could not save", result.error);
    else goBackOr("/settings");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
      <ScrollView className="flex-1 bg-savr-50 dark:bg-savr-950" contentContainerClassName="px-4 pb-6 gap-4" keyboardShouldPersistTaps="handled">
        <Pressable onPress={pickAvatar} className="items-center py-4">
          {avatarUri || user?.avatarUrl ? (
            <Image source={{ uri: avatarUri ?? user?.avatarUrl ?? undefined }} className="w-24 h-24 rounded-full" />
          ) : (
            <View className="w-24 h-24 rounded-full bg-savr-200 dark:bg-savr-700 items-center justify-center">
              <Ionicons name="person" size={40} color="#FF8559" />
            </View>
          )}
          <Text className="text-sm text-savr-350 dark:text-savr-400 mt-2">Change photo</Text>
        </Pressable>
        <Input label="Display Name" value={displayName} onChangeText={setDisplayName} />
        <Input label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <Input label="City" value={city} onChangeText={setCity} />
        <Input label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={3} />
        <Button label="Save Changes" onPress={save} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
