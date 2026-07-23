import { memo } from "react";
import { Platform } from "react-native";
import { Marker } from "react-native-maps";
import type { MapPin, MapPinType } from "@/lib/maps/pins";
import { brandColors } from "@/constants/branding";

/**
 * Resolve native pin color. Future types fall through to the nearby/inactive look
 * until dedicated visual rules ship — keep the map quiet for now.
 *
 * iOS Apple Maps only supports a small set of named colors;
 * selected nearby uses red (closest to coral); unselected nearby uses purple.
 */
export function resolvePinColor(type: MapPinType, selected: boolean): string {
  if (selected) {
    return Platform.OS === "ios" ? "red" : brandColors.primary;
  }
  if (type === "rated") {
    return Platform.OS === "ios" ? "red" : brandColors.primary;
  }
  // nearby | saved | trending | friend | cuisine — same appearance until product rules land
  return Platform.OS === "ios" ? "purple" : brandColors.iconInactive;
}

export const MapMarker = memo(function MapMarker({
  pin,
  selected,
  onPress,
}: {
  pin: MapPin;
  selected?: boolean;
  onPress: (pin: MapPin) => void;
}) {
  return (
    <Marker
      coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
      pinColor={resolvePinColor(pin.type, !!selected)}
      title={pin.title}
      description={pin.subtitle}
      tracksViewChanges={false}
      opacity={selected ? 1 : pin.type === "nearby" ? 0.92 : 1}
      onPress={() => onPress(pin)}
    />
  );
});
