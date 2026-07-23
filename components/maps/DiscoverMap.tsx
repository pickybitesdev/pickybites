import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, LayoutChangeEvent } from "react-native";
import MapView, { PROVIDER_DEFAULT, type Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import type { Restaurant } from "@/lib/types";
import type { PlaceResult, Coordinates } from "@/lib/places/types";
import { regionToSearchRadius } from "@/lib/places/nearby-search";
import { loadMapRegion, saveMapRegion } from "@/lib/prefs";
import {
  buildMapPins,
  isValidCoord,
  MAX_MAP_MARKERS,
  type MapPin,
  type MapPinType,
} from "@/lib/maps/pins";
import { MapPinSheet } from "./MapPinSheet";
import { MapMarker } from "./MapMarker";
import { DISCOVER_CAMERA_DEBOUNCE_MS } from "@/lib/discover-tray";
import type { DiscoverCameraTarget } from "@/lib/discover-search";

export type { MapPin, MapPinType };

const PIN_UPDATE_MS = 350;
const MARKER_MOUNT_MS = 500;

function isValidRegion(r: Region) {
  return (
    isValidCoord(r.latitude, r.longitude) &&
    Number.isFinite(r.latitudeDelta) &&
    Number.isFinite(r.longitudeDelta) &&
    r.latitudeDelta > 0.002 &&
    r.latitudeDelta < 40 &&
    r.longitudeDelta > 0.002 &&
    r.longitudeDelta < 40
  );
}

function buildRegion(coords: Coordinates, pins: MapPin[]): Region {
  if (pins.length === 0) {
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  const lats = [coords.latitude, ...pins.map((p) => p.latitude)];
  const lngs = [coords.longitude, ...pins.map((p) => p.longitude)];
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 1.35;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * pad, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * pad, 0.02),
  };
}

function pinMatchesSelection(
  pin: MapPin,
  selectedPinId: string | null,
  restaurants: Restaurant[],
): boolean {
  if (!selectedPinId) return false;
  if (pin.type === "nearby") return pin.id === selectedPinId;
  if (pin.id === selectedPinId) return true;
  const rest = restaurants.find((r) => r.id === pin.id);
  return rest?.googlePlaceId === selectedPinId;
}

export function DiscoverMap({
  coords,
  restaurants,
  nearbyPlaces,
  onPinPress,
  onSearchArea,
  onRecenterUser,
  onBookmarkPin,
  onAddToListPin,
  isPinBookmarked,
  searching = false,
  fullScreen = false,
  showPinSheet = true,
  onSelectPin,
  selectedPinId = null,
  focusCoordinate = null,
  cameraTarget = null,
  onMapPress,
  hideSearchArea = false,
}: {
  coords: Coordinates;
  restaurants: Restaurant[];
  nearbyPlaces: PlaceResult[];
  onPinPress: (id: string, type: MapPinType) => void;
  onSearchArea?: (center: Coordinates, radiusMeters: number) => void;
  onRecenterUser?: () => void;
  onBookmarkPin?: (id: string, type: MapPinType) => void;
  onAddToListPin?: (id: string, type: MapPinType) => void;
  isPinBookmarked?: (id: string, type: MapPinType) => boolean;
  searching?: boolean;
  fullScreen?: boolean;
  showPinSheet?: boolean;
  onSelectPin?: (pin: MapPin | null) => void;
  selectedPinId?: string | null;
  /** Legacy tray/pin follow — restaurant-level zoom. */
  focusCoordinate?: Coordinates | null;
  /** Explicit search-driven camera (restaurant vs area zoom). */
  cameraTarget?: DiscoverCameraTarget | null;
  onMapPress?: () => void;
  /** Hide floating Search this area while autocomplete is open. */
  hideSearchArea?: boolean;
}) {
  const mapRef = useRef<MapView>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  const [layoutReady, setLayoutReady] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [savedRegion, setSavedRegion] = useState<Region | null>(null);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [markersReady, setMarkersReady] = useState(false);
  const [renderPins, setRenderPins] = useState<MapPin[]>([]);

  useEffect(() => {
    mounted.current = true;
    loadMapRegion().then((r) => {
      if (mounted.current && r && isValidRegion(r)) setSavedRegion(r);
    });
    return () => {
      mounted.current = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (pinTimer.current) clearTimeout(pinTimer.current);
      if (markerTimer.current) clearTimeout(markerTimer.current);
      if (cameraTimer.current) clearTimeout(cameraTimer.current);
    };
  }, []);

  const pins = useMemo(
    () => buildMapPins(restaurants, nearbyPlaces).slice(0, MAX_MAP_MARKERS),
    [restaurants, nearbyPlaces],
  );
  const totalPinCount = useMemo(
    () => buildMapPins(restaurants, nearbyPlaces).length,
    [restaurants, nearbyPlaces],
  );
  const truncated = totalPinCount > pins.length;

  const safeCoords = isValidCoord(coords.latitude, coords.longitude)
    ? coords
    : { latitude: 34.0522, longitude: -118.2437 };

  const region = useMemo(() => buildRegion(safeCoords, pins), [safeCoords, pins]);
  const initialRegion = savedRegion ?? region;

  useEffect(() => {
    if (!markersReady) return;
    if (pinTimer.current) clearTimeout(pinTimer.current);
    pinTimer.current = setTimeout(() => {
      if (mounted.current) setRenderPins(pins);
    }, PIN_UPDATE_MS);
    return () => {
      if (pinTimer.current) clearTimeout(pinTimer.current);
    };
  }, [pins, markersReady]);

  useEffect(() => {
    if (cameraTarget && isValidCoord(cameraTarget.latitude, cameraTarget.longitude)) {
      const nextRegion = {
        latitude: cameraTarget.latitude,
        longitude: cameraTarget.longitude,
        latitudeDelta: cameraTarget.latitudeDelta,
        longitudeDelta: cameraTarget.longitudeDelta,
      };
      // Keep Search this area in sync with programmatic jumps (don't use stale pan region).
      setMapRegion(nextRegion);
      if (cameraTimer.current) clearTimeout(cameraTimer.current);
      cameraTimer.current = setTimeout(() => {
        if (!mounted.current) return;
        mapRef.current?.animateToRegion(nextRegion, 400);
      }, DISCOVER_CAMERA_DEBOUNCE_MS);
      return () => {
        if (cameraTimer.current) clearTimeout(cameraTimer.current);
      };
    }

    if (!focusCoordinate || !isValidCoord(focusCoordinate.latitude, focusCoordinate.longitude)) {
      return;
    }
    if (cameraTimer.current) clearTimeout(cameraTimer.current);
    cameraTimer.current = setTimeout(() => {
      if (!mounted.current) return;
      mapRef.current?.animateToRegion(
        {
          latitude: focusCoordinate.latitude,
          longitude: focusCoordinate.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        350,
      );
    }, DISCOVER_CAMERA_DEBOUNCE_MS);
    return () => {
      if (cameraTimer.current) clearTimeout(cameraTimer.current);
    };
  }, [
    cameraTarget?.token,
    cameraTarget?.latitude,
    cameraTarget?.longitude,
    cameraTarget?.latitudeDelta,
    cameraTarget?.longitudeDelta,
    focusCoordinate?.latitude,
    focusCoordinate?.longitude,
  ]);

  const persistRegion = useCallback((r: Region) => {
    if (!isValidRegion(r)) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveMapRegion({
        latitude: r.latitude,
        longitude: r.longitude,
        latitudeDelta: r.latitudeDelta,
        longitudeDelta: r.longitudeDelta,
      });
    }, 800);
  }, []);

  const handleSearchArea = () => {
    const active = mapRegion ?? initialRegion;
    onSearchArea?.(
      { latitude: active.latitude, longitude: active.longitude },
      regionToSearchRadius(active),
    );
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    if (width > 0 && h > 0) setLayoutReady(true);
  };

  const handleMapReady = useCallback(() => {
    if (markerTimer.current) clearTimeout(markerTimer.current);
    markerTimer.current = setTimeout(() => {
      if (mounted.current) {
        setMarkersReady(true);
        setRenderPins(pins);
      }
    }, MARKER_MOUNT_MS);
  }, [pins]);

  const handleMarkerPress = useCallback(
    (pin: MapPin) => {
      if (showPinSheet) setSelectedPin(pin);
      onSelectPin?.(pin);
    },
    [onSelectPin, showPinSheet],
  );

  const clearSelection = useCallback(() => {
    setSelectedPin(null);
    onSelectPin?.(null);
  }, [onSelectPin]);

  const mapHeight = fullScreen ? undefined : 320;

  return (
    <View
      className={fullScreen ? "flex-1" : "rounded-2xl overflow-hidden border border-savr-200 dark:border-savr-700"}
      style={fullScreen ? { flex: 1 } : { height: mapHeight }}
      onLayout={handleLayout}
    >
      {layoutReady ? (
        <MapView
          ref={mapRef}
          style={fullScreen ? styles.mapFlex : styles.mapFixed}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          moveOnMarkerPress={false}
          loadingEnabled
          onMapReady={handleMapReady}
          onPress={() => {
            onMapPress?.();
          }}
          onRegionChangeComplete={(r) => {
            setMapRegion(r);
            persistRegion(r);
          }}
        >
          {markersReady &&
            renderPins.map((pin) => (
              <MapMarker
                key={`${pin.type}-${pin.id}`}
                pin={pin}
                selected={pinMatchesSelection(pin, selectedPinId, restaurants)}
                onPress={handleMarkerPress}
              />
            ))}
        </MapView>
      ) : (
        <View className="flex-1 items-center justify-center bg-savr-100 dark:bg-savr-900">
          <ActivityIndicator color="#FF8559" />
        </View>
      )}

      {pins.length === 0 && !searching && layoutReady && markersReady && (
        <View className="absolute inset-0 items-center justify-center bg-black/20 px-6 pointer-events-none">
          <View className="bg-white dark:bg-savr-800 rounded-2xl p-4 items-center gap-2 max-w-xs">
            <Ionicons name="map-outline" size={32} color="#FF8559" />
            <Text className="font-semibold text-savr-900 dark:text-savr-100 text-center">No pins yet</Text>
            <Text className="text-sm text-savr-500 dark:text-savr-400 text-center">
              Pan the map, then tap Search this area.
            </Text>
          </View>
        </View>
      )}

      {onSearchArea && !hideSearchArea ? (
        <View className="absolute top-3 left-0 right-0 items-center px-4">
          <Pressable
            onPress={handleSearchArea}
            disabled={searching}
            className="flex-row items-center gap-2 bg-savr-500 rounded-full px-4 py-2.5"
            style={styles.shadow}
          >
            {searching ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="search" size={18} color="#fff" />
            )}
            <Text className="text-white font-semibold text-sm">
              {searching ? "Searching..." : "Search this area"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={() => {
          clearSelection();
          if (onRecenterUser) {
            onRecenterUser();
            return;
          }
          mapRef.current?.animateToRegion(region, 500);
        }}
        className="absolute top-3 right-3 bg-white dark:bg-savr-800 rounded-full p-2"
        style={{ marginTop: onSearchArea ? 48 : 0 }}
        accessibilityLabel="Recenter map"
      >
        <Ionicons name="locate" size={20} color="#FF8559" />
      </Pressable>

      {showPinSheet && selectedPin ? (
        <MapPinSheet
          title={selectedPin.title}
          subtitle={selectedPin.subtitle}
          type={selectedPin.type}
          isBookmarked={isPinBookmarked?.(selectedPin.id, selectedPin.type)}
          onClose={clearSelection}
          onView={() => {
            clearSelection();
            onPinPress(selectedPin.id, selectedPin.type);
          }}
          onRate={() => {
            clearSelection();
            onPinPress(selectedPin.id, selectedPin.type);
          }}
          onBookmark={
            onBookmarkPin
              ? () => onBookmarkPin(selectedPin.id, selectedPin.type)
              : undefined
          }
          onAddToList={
            onAddToListPin
              ? () => onAddToListPin(selectedPin.id, selectedPin.type)
              : undefined
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapFlex: { flex: 1, width: "100%" },
  mapFixed: { ...StyleSheet.absoluteFillObject },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
