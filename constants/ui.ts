import { brandColors } from "./branding";

/** Shared NativeWind class strings for consistent light/dark styling */
export const ui = {
  screen: "bg-savr-50 dark:bg-savr-950",
  text: {
    primary: "text-savr-900 dark:text-savr-50",
    secondary: "text-savr-350 dark:text-savr-200",
    muted: "text-savr-400 dark:text-savr-400",
    faint: "text-savr-400 dark:text-savr-500",
  },
  surface: {
    card: "bg-white dark:bg-savr-875",
    elevated: "bg-white dark:bg-savr-800",
    inset: "bg-savr-50 dark:bg-savr-925",
    muted: "bg-savr-100 dark:bg-savr-800",
    track: "bg-savr-100 dark:bg-savr-800",
    search: "bg-white dark:bg-savr-875 border border-savr-200 dark:border-savr-800",
    segment: "bg-savr-100 dark:bg-savr-925",
  },
  border: {
    subtle: "border-savr-200 dark:border-savr-800",
    divider: "border-savr-100 dark:border-savr-800",
  },
  accentCard: "bg-white dark:bg-savr-925 border-l-[3px] border-l-savr-500 dark:border-l-savr-500",
} as const;

export const iconColors = {
  brand: brandColors.primary,
  brandDark: brandColors.primaryOnDark,
  muted: brandColors.iconInactive,
  mutedDark: brandColors.iconInactive,
  star: brandColors.primary,
  starDark: brandColors.primaryOnDark,
} as const;
