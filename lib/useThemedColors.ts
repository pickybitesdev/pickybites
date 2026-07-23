import { useThemeStore, themeColors } from "@/store/useThemeStore";
import { brandColors } from "@/constants/branding";

export function useThemedColors() {
  const resolved = useThemeStore((s) => s.resolved);
  const isDark = resolved === "dark";
  const palette = themeColors[resolved];

  return {
    isDark,
    resolved,
    palette,
    brand: isDark ? brandColors.primaryOnDark : brandColors.primary,
    brandSoft: isDark ? brandColors.primaryMutedOnDark : brandColors.primarySoft,
    brandPressed: brandColors.primaryPressed,
    icon: isDark ? brandColors.primaryOnDark : brandColors.textPrimary,
    iconMuted: brandColors.iconInactive,
    placeholder: isDark ? "#6B6570" : brandColors.border,
    spinner: isDark ? brandColors.primaryOnDark : brandColors.primary,
    heart: brandColors.error,
    danger: brandColors.error,
    success: brandColors.success,
    warning: brandColors.warning,
    divider: isDark ? "#4A4450" : brandColors.border,
  };
}
