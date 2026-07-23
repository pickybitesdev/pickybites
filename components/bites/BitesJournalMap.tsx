import { useMemo, useRef, useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import MapView, { PROVIDER_DEFAULT, Marker, type Region } from "react-native-maps";
import { router } from "expo-router";
import type { FoodJournalEntry } from "@/lib/foodJournal";
import { isValidCoord } from "@/lib/maps/pins";
import type { Coordinates } from "@/lib/places/types";
import { ui } from "@/constants/ui";
import { brandColors } from "@/constants/branding";

function regionFromEntries(entries: FoodJournalEntry[], fallback: Coordinates | null): Region {
  const withCoords = entries.filter(
    (e) => e.latitude != null && e.longitude != null && isValidCoord(e.latitude, e.longitude),
  );
  if (withCoords.length === 0) {
    return {
      latitude: fallback?.latitude ?? 37.77,
      longitude: fallback?.longitude ?? -122.42,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }
  const lats = withCoords.map((e) => e.latitude!);
  const lngs = withCoords.map((e) => e.longitude!);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.04),
    longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.04),
  };
}

export function BitesJournalMap({
  entries,
  coords,
}: {
  entries: FoodJournalEntry[];
  coords: Coordinates | null;
}) {
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pins = useMemo(
    () =>
      entries.filter(
        (e) => e.latitude != null && e.longitude != null && isValidCoord(e.latitude, e.longitude),
      ),
    [entries],
  );

  const selected = pins.find((p) => p.review_id === selectedId) ?? null;

  useEffect(() => {
    const region = regionFromEntries(pins, coords);
    mapRef.current?.animateToRegion(region, 400);
  }, [pins, coords]);

  return (
    <View className="overflow-hidden rounded-2xl" style={{ height: 420 }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={regionFromEntries(pins, coords)}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {pins.map((entry) => (
          <Marker
            key={entry.review_id}
            coordinate={{ latitude: entry.latitude!, longitude: entry.longitude! }}
            pinColor={brandColors.primary}
            onPress={() => setSelectedId(entry.review_id)}
          />
        ))}
      </MapView>

      {selected ? (
        <Pressable
          onPress={() => router.push(`/bite/${selected.review_id}`)}
          className={`absolute left-3 right-3 rounded-2xl p-4 ${ui.surface.elevated}`}
          style={{ bottom: 12 }}
          accessibilityRole="button"
          accessibilityLabel={`Open ${selected.restaurant_name}`}
        >
          <Text className={`text-base font-semibold ${ui.text.primary}`}>
            {selected.restaurant_name}
          </Text>
          <Text className={`text-xs mt-0.5 ${ui.text.muted}`}>
            {selected.cuisine}
            {selected.city ? ` · ${selected.city}` : ""}
            {` · ${selected.rating_value}/${selected.rating_max}`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
