import { Pressable, Text } from "react-native";
import { cn } from "@/lib/utils";

export function Tag({ label, active, onPress, size = "md" }: { label: string; active?: boolean; onPress?: () => void; size?: "sm" | "md" }) {
  const inner = (
    <Text
      className={cn(
        "font-medium rounded-full",
        size === "sm" ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1.5",
        active
          ? "bg-savr-500 text-white"
          : "bg-savr-100 text-savr-900 dark:bg-savr-925 dark:text-savr-200"
      )}
    >
      {label}
    </Text>
  );
  if (onPress) return <Pressable onPress={onPress} className="min-h-[36px] justify-center">{inner}</Pressable>;
  return inner;
}
