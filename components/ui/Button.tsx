import { Pressable, Text, ActivityIndicator, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";
import { useThemedColors } from "@/lib/useThemedColors";
import { brandColors } from "@/constants/branding";

interface ButtonProps extends PressableProps {
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  className?: string;
  haptic?: boolean;
}

export function Button({ label, variant = "primary", loading, className, disabled, haptic = true, onPress, ...props }: ButtonProps) {
  const colors = useThemedColors();
  const base = "rounded-2xl py-4 px-6 items-center justify-center min-h-[52px]";
  const variants = {
    // Solid CTAs use primaryPressed (#E96F45) so white label text meets WCAG AA large.
    primary: "bg-savr-600 dark:bg-savr-600 active:bg-savr-700 dark:active:bg-savr-700",
    secondary: "bg-white dark:bg-savr-875 border border-savr-500 dark:border-savr-500 active:bg-savr-100 dark:active:bg-savr-800",
    ghost: "bg-transparent active:bg-savr-100 dark:active:bg-savr-925",
    danger: "bg-[#D94A4A] active:opacity-90",
  };
  const textVariants = {
    primary: "text-white font-semibold text-base",
    secondary: "text-savr-500 dark:text-savr-500 font-semibold text-base",
    ghost: "text-savr-500 dark:text-savr-500 font-semibold text-base",
    danger: "text-white font-semibold text-base",
  };

  const handlePress = (e: Parameters<NonNullable<PressableProps["onPress"]>>[0]) => {
    if (haptic) hapticLight();
    onPress?.(e);
  };

  return (
    <Pressable
      className={cn(
        base,
        variants[variant],
        (disabled || loading) && "opacity-50 bg-savr-200 dark:bg-savr-800 border-transparent",
        className,
      )}
      disabled={disabled || loading}
      onPress={handlePress}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary" || variant === "danger"
              ? "#fff"
              : colors.brand
          }
        />
      ) : (
        <Text
          className={cn(
            textVariants[variant],
            (disabled || loading) && "text-savr-400",
          )}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** Exported for tests — maps Button variants to coral hierarchy expectations. */
export const BUTTON_VARIANT_TOKENS = {
  primary: { bg: brandColors.primaryPressed, text: "#FFFFFF" },
  secondary: { bg: brandColors.surface, text: brandColors.primary },
  ghost: { bg: "transparent", text: brandColors.primary },
  danger: { bg: brandColors.error, text: "#FFFFFF" },
  disabled: { bg: brandColors.border, text: brandColors.iconInactive },
} as const;
