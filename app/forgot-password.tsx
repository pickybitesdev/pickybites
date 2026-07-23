import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { goBackOr } from "@/lib/navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";

export default function ForgotPasswordScreen() {
  const requestPasswordReset = useAppStore((s) => s.requestPasswordReset);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const result = await requestPasswordReset(email);
    setLoading(false);
    if (!result.ok) setError(result.error);
    else setSent(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-savr-50 dark:bg-savr-950">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="px-6 py-8 gap-4" keyboardShouldPersistTaps="handled">
          <Text className="text-3xl font-bold text-savr-900 dark:text-savr-100 mt-4">Forgot password?</Text>
          <Text className="text-savr-350 dark:text-savr-400">
            Enter your email and we&apos;ll send a reset link.
          </Text>

          {sent ? (
            <View className="bg-savr-100 dark:bg-savr-800 rounded-xl p-4">
              <Text className="text-savr-800 dark:text-savr-200">
                Check your inbox for a reset link. Open it on this device to set a new password.
              </Text>
            </View>
          ) : (
            <>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
              />
              {error ? <Text className="text-red-500 text-sm">{error}</Text> : null}
              <Button label="Send Reset Link" onPress={handleSubmit} loading={loading} />
            </>
          )}
          <Button label="Back to login" variant="ghost" onPress={() => goBackOr("/login")} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
