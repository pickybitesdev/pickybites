import { brandColors } from "@/constants/branding";

/** Re-export brand tokens for any legacy Expo Colors import sites. */
export default {
  light: {
    text: brandColors.textPrimary,
    background: brandColors.background,
    tint: brandColors.primary,
    tabIconDefault: brandColors.iconInactive,
    tabIconSelected: brandColors.primary,
  },
  dark: {
    text: "#FAFAFA",
    background: brandColors.backgroundDark,
    tint: brandColors.primaryOnDark,
    tabIconDefault: brandColors.iconInactive,
    tabIconSelected: brandColors.primaryOnDark,
  },
};
