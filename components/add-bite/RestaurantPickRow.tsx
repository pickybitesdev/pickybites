import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { RestaurantPickItem } from "@/lib/add-bite-restaurant-sources";
import { brandColors } from "@/constants/branding";
import { formatDistance } from "@/lib/utils";

export function RestaurantPickRow({
  item,
  selected,
  onPress,
}: {
  item: RestaurantPickItem;
  selected: boolean;
  onPress: () => void;
}) {
  const locationLabel =
    item.distanceMeters != null
      ? formatDistance(item.distanceMeters)
      : item.city || item.address || null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${item.name}${selected ? ", selected" : ""}`}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? brandColors.primary : brandColors.border,
        backgroundColor: selected ? brandColors.primaryLight : brandColors.surface,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: 48, height: 48, borderRadius: 10 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            backgroundColor: brandColors.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="restaurant" size={22} color={brandColors.primary} />
        </View>
      )}

      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{ fontSize: 16, fontWeight: "600", color: brandColors.textPrimary }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={{ fontSize: 13, color: brandColors.textSecondary }} numberOfLines={1}>
          {[item.cuisine, locationLabel].filter(Boolean).join(" · ")}
        </Text>
        {item.pickybitesScore != null ? (
          <Text style={{ fontSize: 12, fontWeight: "600", color: brandColors.primary }}>
            PickyBites {item.pickybitesScore}
          </Text>
        ) : null}
      </View>

      {selected ? (
        <Ionicons name="checkmark-circle" size={24} color={brandColors.primary} />
      ) : (
        <View style={{ width: 24 }} />
      )}
    </Pressable>
  );
}
