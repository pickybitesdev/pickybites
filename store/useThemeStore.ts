import { create } from "zustand";
import { Appearance } from "react-native";
import { colorScheme } from "nativewind";
import { brandColors } from "@/constants/branding";
import { loadThemeMode, saveThemeMode } from "@/lib/prefs";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  resolved: "light" | "dark";
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  hydrate: () => Promise<void>;
}

/**
 * Dark mode is disabled for launch — the dark palette clashes on iOS.
 *
 * Pinned here rather than deleting the ~234 `dark:` classes across the app, so
 * the work is recoverable: set this to false to re-enable, and restore the
 * Appearance selector in app/settings.tsx.
 */
const FORCE_LIGHT = true;

function resolve(mode: ThemeMode): "light" | "dark" {
  if (FORCE_LIGHT) return "light";
  if (mode === "system") {
    return Appearance.getColorScheme() === "dark" ? "dark" : "light";
  }
  return mode;
}

function apply(scheme: "light" | "dark") {
  colorScheme.set(scheme);
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = resolve("system");
  apply(initial);

  Appearance.addChangeListener(({ colorScheme: cs }) => {
    if (FORCE_LIGHT) return;
    if (get().mode !== "system") return;
    const resolved = cs === "dark" ? "dark" : "light";
    if (get().resolved === resolved) return;
    apply(resolved);
    set({ resolved });
  });

  return {
    mode: "system",
    resolved: initial,
    hydrated: false,
    setMode: (mode) => {
      const resolved = resolve(mode);
      if (get().mode === mode && get().resolved === resolved) return;
      apply(resolved);
      set({ mode, resolved });
      void saveThemeMode(mode);
    },
    hydrate: async () => {
      const saved = await loadThemeMode();
      if (saved) {
        const resolved = resolve(saved);
        if (get().mode !== saved || get().resolved !== resolved) {
          apply(resolved);
          set({ mode: saved, resolved, hydrated: true });
        } else {
          set({ hydrated: true });
        }
      } else {
        set({ hydrated: true });
      }
    },
  };
});

export const themeColors = {
  light: {
    background: brandColors.background,
    card: brandColors.surface,
    border: brandColors.border,
    tabBar: brandColors.surface,
    tabActive: brandColors.primary,
    tabInactive: brandColors.iconInactive,
    addBorder: brandColors.background,
    statusBar: "dark" as const,
  },
  dark: {
    background: brandColors.backgroundDark,
    card: "#252030",
    border: "#4A4450",
    tabBar: "#181C28",
    tabActive: brandColors.primaryOnDark,
    tabInactive: brandColors.iconInactive,
    addBorder: brandColors.backgroundDark,
    statusBar: "light" as const,
  },
};
