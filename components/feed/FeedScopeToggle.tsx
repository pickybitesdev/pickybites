import { View, Text, Pressable, StyleSheet } from "react-native";
import type { FeedScope } from "@/lib/feed/types";
import { brandColors } from "@/constants/branding";

export function FeedScopeToggle({
  scope,
  onChange,
}: {
  scope: FeedScope;
  onChange: (scope: FeedScope) => void;
}) {
  return (
    <View style={styles.track} testID="feed-scope-toggle">
      <Pressable
        onPress={() => onChange("for_you")}
        accessibilityRole="button"
        accessibilityState={{ selected: scope === "for_you" }}
        accessibilityLabel="For You"
        style={[styles.segment, scope === "for_you" && styles.segmentActive]}
      >
        <Text style={[styles.label, scope === "for_you" && styles.labelActive]}>For You</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange("friends")}
        accessibilityRole="button"
        accessibilityState={{ selected: scope === "friends" }}
        accessibilityLabel="Friends"
        style={[styles.segment, scope === "friends" && styles.segmentActive]}
      >
        <Text style={[styles.label, scope === "friends" && styles.labelActive]}>Friends</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: brandColors.surface,
    borderWidth: 1,
    borderColor: brandColors.border,
    padding: 3,
  },
  segment: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: brandColors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: brandColors.iconInactive,
  },
  labelActive: {
    color: "#FFFFFF",
  },
});
