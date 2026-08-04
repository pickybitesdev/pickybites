import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CUISINES, type Cuisine } from "@/lib/types";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StepProgress } from "@/components/reviews/StepProgress";
import { useAppStore } from "@/store/useAppStore";
import {
  BUDGET_OPTIONS,
  DIET_OPTIONS,
  FOOD_GOAL_OPTIONS,
  saveTastePreferences,
  type DietPreference,
  type FoodGoal,
  type TastePreferences,
} from "@/lib/taste-preferences";
import { ui } from "@/constants/ui";
import { hapticSuccess } from "@/lib/haptics";
import type { PriceLevel } from "@/lib/types";

const STEPS = ["Cuisines", "Diet", "Budget", "Favorite Spot", "Food Goals"];

export default function TasteQuizScreen() {
  const completeTasteQuiz = useAppStore((s) => s.completeTasteQuiz);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<Cuisine[]>([]);
  const [diet, setDiet] = useState<DietPreference[]>(["None"]);
  const [budget, setBudget] = useState<PriceLevel | null>(2);
  const [favoriteRestaurant, setFavoriteRestaurant] = useState("");
  const [goals, setGoals] = useState<FoodGoal[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleCuisine = (cuisine: Cuisine) => {
    setSelected((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : prev.length < 5 ? [...prev, cuisine] : prev,
    );
  };

  const toggleDiet = (value: DietPreference) => {
    if (value === "None") {
      setDiet(["None"]);
      return;
    }
    setDiet((prev) => {
      const next = prev.filter((d) => d !== "None");
      return next.includes(value) ? next.filter((d) => d !== value) : [...next, value];
    });
  };

  const toggleGoal = (goal: FoodGoal) => {
    setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));
  };

  const finish = async () => {
    setLoading(true);
    setError("");
    const result = await completeTasteQuiz(selected);
    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }
    if (currentUserId) {
      const prefs: TastePreferences = {
        dietPreferences: diet,
        budgetRange: budget,
        favoriteRestaurant: favoriteRestaurant.trim(),
        foodGoals: goals,
      };
      const saved = await saveTastePreferences(currentUserId, prefs);
      if (!saved.ok) {
        setLoading(false);
        setError(saved.error);
        return;
      }
    }
    setLoading(false);
    hapticSuccess();
    router.replace("/(tabs)/discover");
  };

  const next = () => {
    if (step === 1 && selected.length < 3) {
      setError("Pick at least 3 cuisines.");
      return;
    }
    setError("");
    if (step < STEPS.length) setStep((s) => s + 1);
    else void finish();
  };

  const back = () => {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  };

  return (
    <SafeAreaView className={`flex-1 ${ui.screen}`}>
      <ScrollView contentContainerClassName="px-6 py-6 gap-5" keyboardShouldPersistTaps="handled">
        <StepProgress step={step} total={STEPS.length} labels={STEPS} />

        {step === 1 && (
          <>
            <Text className={`text-3xl font-bold ${ui.text.primary}`}>What do you love?</Text>
            <Text className={ui.text.secondary}>Pick at least 3 cuisines to personalize PickyBites.</Text>
            <View className="flex-row flex-wrap gap-2">
              {CUISINES.map((c) => (
                <Tag key={c} label={c} active={selected.includes(c)} onPress={() => toggleCuisine(c)} />
              ))}
            </View>
            <Text className={`text-sm ${ui.text.muted}`}>{selected.length} selected (min 3)</Text>
          </>
        )}

        {step === 2 && (
          <>
            <Text className={`text-3xl font-bold ${ui.text.primary}`}>Diet preferences</Text>
            <Text className={ui.text.secondary}>Optional — helps us surface the right spots.</Text>
            <View className="flex-row flex-wrap gap-2">
              {DIET_OPTIONS.map((d) => (
                <Tag key={d} label={d} active={diet.includes(d)} onPress={() => toggleDiet(d)} />
              ))}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text className={`text-3xl font-bold ${ui.text.primary}`}>Budget range</Text>
            <Text className={ui.text.secondary}>What do you usually spend per person?</Text>
            <View className="flex-row flex-wrap gap-2">
              {BUDGET_OPTIONS.map((b) => (
                <Tag key={b.value} label={b.label} active={budget === b.value} onPress={() => setBudget(b.value)} />
              ))}
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <Text className={`text-3xl font-bold ${ui.text.primary}`}>Favorite restaurant</Text>
            <Text className={ui.text.secondary}>The spot you'd recommend to anyone.</Text>
            <Input
              value={favoriteRestaurant}
              onChangeText={setFavoriteRestaurant}
              placeholder="e.g. Lucali, Nobu, your local taco truck..."
            />
          </>
        )}

        {step === 5 && (
          <>
            <Text className={`text-3xl font-bold ${ui.text.primary}`}>Food goals</Text>
            <Text className={ui.text.secondary}>What kind of eater are you becoming?</Text>
            <View className="flex-row flex-wrap gap-2">
              {FOOD_GOAL_OPTIONS.map((g) => (
                <Tag key={g} label={g} active={goals.includes(g)} onPress={() => toggleGoal(g)} />
              ))}
            </View>
          </>
        )}

        {error ? <Text className="text-red-500 text-sm">{error}</Text> : null}

        <View className="flex-row gap-3">
          {step > 1 ? <Button label="Back" variant="secondary" onPress={back} className="flex-1" /> : null}
          <Button
            label={step === STEPS.length ? "Finish" : "Continue"}
            onPress={next}
            loading={loading}
            className="flex-1"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
