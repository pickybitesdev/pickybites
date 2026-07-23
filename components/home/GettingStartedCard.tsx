import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ui } from "@/constants/ui";
import { cn } from "@/lib/utils";
import { loadGettingStartedDismissed, saveGettingStartedDismissed } from "@/lib/prefs";
import { shareInvite } from "@/lib/share";

type Step = {
  id: string;
  label: string;
  done: boolean;
  onPress: () => void;
};

export function GettingStartedCard({
  displayName,
  hasTasteQuiz,
  reviewCount,
  followingCount,
}: {
  displayName: string;
  hasTasteQuiz: boolean;
  reviewCount: number;
  followingCount: number;
}) {
  const [dismissed, setDismissed] = useState(true); // hide until prefs load — avoids Feed header jump

  useEffect(() => {
    loadGettingStartedDismissed().then(setDismissed);
  }, []);

  const steps: Step[] = [
    {
      id: "quiz",
      label: "Complete your taste quiz",
      done: hasTasteQuiz,
      onPress: () => router.push("/taste-quiz"),
    },
    {
      id: "review",
      label: "Rate your first restaurant",
      done: reviewCount > 0,
      onPress: () => router.push("/add-bite"),
    },
    {
      id: "follow",
      label: "Follow a friend",
      done: followingCount > 0,
      onPress: () => router.push("/friends"),
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const allDone = completed === steps.length;

  if (dismissed || allDone || reviewCount >= 3) return null;

  return (
    <View className="px-4">
      <Card className={cn("gap-3", ui.accentCard)}>
        <View className="flex-row justify-between items-start gap-2">
          <View className="flex-1">
            <Text className={`font-semibold ${ui.text.primary}`}>Getting started</Text>
            <Text className={`text-sm mt-0.5 ${ui.text.secondary}`}>
              {completed}/{steps.length} done — unlock your full taste map
            </Text>
          </View>
          <Pressable
            onPress={() => {
              void saveGettingStartedDismissed();
              setDismissed(true);
            }}
            hitSlop={8}
            className="p-1"
          >
            <Ionicons name="close" size={20} color="#9D9692" />
          </Pressable>
        </View>

        <View className="gap-2">
          {steps.map((step) => (
            <Pressable
              key={step.id}
              onPress={step.done ? undefined : step.onPress}
              disabled={step.done}
              className={cn(
                "flex-row items-center gap-3 py-2 px-2 rounded-xl",
                !step.done && ui.surface.inset,
              )}
            >
              <Ionicons
                name={step.done ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={step.done ? "#2FA866" : "#9D9692"}
              />
              <Text
                className={cn(
                  "flex-1 text-sm",
                  step.done ? `${ui.text.muted} line-through` : ui.text.secondary,
                )}
              >
                {step.label}
              </Text>
              {!step.done && <Ionicons name="chevron-forward" size={16} color="#9D9692" />}
            </Pressable>
          ))}
        </View>

        <Button
          label={`Invite friends`}
          variant="secondary"
          onPress={() => shareInvite(displayName)}
        />
      </Card>
    </View>
  );
}

