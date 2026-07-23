import { View, Text, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";

export type WrappedGradient = {
  colors: [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

export const WRAPPED_GRADIENTS = {
  intro: { colors: ["#0F1219", "#1E2330", "#FF8559"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  stats: { colors: ["#0F172A", "#312E81", "#7C3AED"], start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
  cuisine: { colors: ["#3B0764", "#7E22CE", "#F59E0B"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  best: { colors: ["#14532D", "#166534", "#FACC15"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  hidden: { colors: ["#042F2E", "#0F766E", "#5EEAD4"], start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
  dna: { colors: ["#4A044E", "#86198F", "#F472B6"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  top5: { colors: ["#1E1B4B", "#4338CA", "#C084FC"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  finale: { colors: ["#1E2330", "#FF8559", "#FFD9CC"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
} as const satisfies Record<string, WrappedGradient>;

export function WrappedCardShell({
  gradient,
  children,
  style,
  shareMode = false,
}: {
  gradient: WrappedGradient;
  children: ReactNode;
  style?: ViewStyle;
  shareMode?: boolean;
}) {
  return (
    <View
      style={[
        {
          width: shareMode ? 360 : "100%",
          height: shareMode ? 640 : "100%",
          borderRadius: shareMode ? 28 : 0,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradient.colors}
        start={gradient.start ?? { x: 0, y: 0 }}
        end={gradient.end ?? { x: 1, y: 1 }}
        style={{ flex: 1, padding: shareMode ? 28 : 32, justifyContent: "space-between" }}
      >
        <View
          style={{
            position: "absolute",
            top: -40,
            right: -30,
            width: 180,
            height: 180,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 80,
            left: -50,
            width: 220,
            height: 220,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        />
        {children}
      </LinearGradient>
    </View>
  );
}

export function WrappedEyebrow({ children }: { children: string }) {
  return (
    <Text
      style={{
        color: "rgba(255,255,255,0.72)",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 2,
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}

export function WrappedHeroText({ children, size = "xl" }: { children: string; size?: "lg" | "xl" | "xxl" }) {
  const fontSize = size === "xxl" ? 52 : size === "xl" ? 40 : 30;
  return (
    <Text
      style={{
        color: "#FFFFFF",
        fontSize,
        fontWeight: "900",
        lineHeight: fontSize * 1.05,
        letterSpacing: -1,
      }}
    >
      {children}
    </Text>
  );
}

export function WrappedStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: "#FFFFFF", fontSize: 56, fontWeight: "900", letterSpacing: -2 }}>{value}</Text>
      <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 16, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

export function WrappedFooter() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Ionicons name="gift" size={18} color="rgba(255,255,255,0.7)" />
      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" }}>PickyBites Wrapped</Text>
    </View>
  );
}
