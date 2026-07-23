import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import { hapticSuccess } from "@/lib/haptics";

export default function Login() {
  const login = useAppStore((s) => s.login);
  const demoLogin = useAppStore((s) => s.demoLogin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const goHome = (userId: string) => {
    const user = useAppStore.getState().users.find((u) => u.id === userId);
    if (user && !user.hasCompletedTasteQuiz) router.replace("/taste-quiz");
    else router.replace("/(tabs)/discover");
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) setError(result.error);
    else {
      hapticSuccess();
      const uid = useAppStore.getState().currentUserId;
      if (uid) goHome(uid);
      else router.replace("/(tabs)/discover");
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError("");
    const result = await demoLogin();
    setLoading(false);
    if (!result.ok) setError(result.error);
    else {
      hapticSuccess();
      const uid = useAppStore.getState().currentUserId;
      if (uid) goHome(uid);
      else router.replace("/(tabs)/discover");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-savr-50 dark:bg-savr-950">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="px-6 py-8 gap-4" keyboardShouldPersistTaps="handled">
          <View className="items-center mb-4 mt-4">
            <Logo size="lg" showName showTagline />
            <Text className="text-3xl font-bold text-savr-900 dark:text-savr-100 mt-3">Welcome back</Text>
            <Text className="text-savr-350 dark:text-savr-400 text-center mt-1">Log in to continue your taste journey.</Text>
          </View>

          <Button label="Try Demo — Alex Rivera" variant="demo" onPress={handleDemoLogin} loading={loading} />
          <View className="flex-row items-center gap-3 my-1">
            <View className="flex-1 h-px bg-savr-200 dark:bg-savr-700" />
            <Text className="text-xs text-savr-400 dark:text-savr-500">or sign in</Text>
            <View className="flex-1 h-px bg-savr-200 dark:bg-savr-700" />
          </View>

          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="alex@example.com" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
          <Button label="Forgot password?" variant="ghost" onPress={() => router.push("/forgot-password")} className="min-h-[40px] py-2" />
          {error ? <Text className="text-red-500 text-sm">{error}</Text> : null}
          <Button label="Log In" onPress={handleLogin} loading={loading} />
          <Button label="Create account" variant="ghost" onPress={() => router.push("/signup")} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
