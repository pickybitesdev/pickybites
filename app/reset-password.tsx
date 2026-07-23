import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { hapticSuccess } from "@/lib/haptics";

export default function ResetPasswordScreen() {
  const updatePassword = useAppStore((s) => s.updatePassword);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    const result = await updatePassword(password);
    setLoading(false);
    if (!result.ok) setError(result.error);
    else {
      hapticSuccess();
      router.replace("/(tabs)/discover");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-savr-50 dark:bg-savr-950">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="px-6 py-8 gap-4" keyboardShouldPersistTaps="handled">
          <Text className="text-3xl font-bold text-savr-900 dark:text-savr-100 mt-4">New password</Text>
          <Text className="text-savr-350 dark:text-savr-400">Choose a strong password (8+ characters).</Text>
          <Input label="New password" value={password} onChangeText={setPassword} secureTextEntry />
          <Input label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />
          {error ? <Text className="text-red-500 text-sm">{error}</Text> : null}
          <Button label="Update Password" onPress={handleSubmit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

