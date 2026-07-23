import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DiscoverViewMode } from "@/lib/discover-view";
import { brandColors } from "@/constants/branding";
import { hapticSelection } from "@/lib/haptics";

/** Compact Map/List segmented control for the floating results tray. */
export function DiscoverMapListToggle({
  mode,
  onChange,
  size = "default",
}: {
  mode: DiscoverViewMode;
  onChange: (mode: DiscoverViewMode) => void;
  size?: "default" | "compact";
}) {
  const compact = size === "compact";

  const select = (next: DiscoverViewMode) => {
    if (next === mode) return;
    hapticSelection();
    onChange(next);
  };

  return (
    <View style={[styles.track, compact && styles.trackCompact]}>
      <Pressable
        onPress={() => select("map")}
        accessibilityRole="button"
        accessibilityState={{ selected: mode === "map" }}
        accessibilityLabel="Map view"
        style={[
          styles.segment,
          compact && styles.segmentCompact,
          mode === "map" && styles.segmentActive,
        ]}
      >
        <Ionicons
          name="map"
          size={compact ? 13 : 14}
          color={mode === "map" ? "#fff" : brandColors.iconInactive}
        />
        <Text style={[styles.label, compact && styles.labelCompact, mode === "map" && styles.labelActive]}>
          Map
        </Text>
      </Pressable>
      <Pressable
        onPress={() => select("list")}
        accessibilityRole="button"
        accessibilityState={{ selected: mode === "list" }}
        accessibilityLabel="List view"
        style={[
          styles.segment,
          compact && styles.segmentCompact,
          mode === "list" && styles.segmentActive,
        ]}
      >
        <Ionicons
          name="list"
          size={compact ? 13 : 14}
          color={mode === "list" ? "#fff" : brandColors.iconInactive}
        />
        <Text style={[styles.label, compact && styles.labelCompact, mode === "list" && styles.labelActive]}>
          List
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 180,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 22,
    backgroundColor: brandColors.surface,
    borderWidth: 1,
    borderColor: brandColors.border,
    padding: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  trackCompact: {
    width: 128,
    height: 34,
    borderRadius: 17,
    padding: 2,
    alignSelf: "auto",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  segment: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  segmentCompact: {
    height: 30,
    borderRadius: 15,
    gap: 3,
  },
  segmentActive: {
    backgroundColor: brandColors.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: brandColors.iconInactive,
  },
  labelCompact: {
    fontSize: 11,
  },
  labelActive: {
    color: "#FFFFFF",
  },
});
