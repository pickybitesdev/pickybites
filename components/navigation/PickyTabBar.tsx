import { Platform, View, Text, StyleSheet } from "react-native";
import { CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlatformPressable } from "@react-navigation/elements";
import { router } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useThemeStore, themeColors } from "@/store/useThemeStore";
import { hapticMedium, hapticSelection } from "@/lib/haptics";
import { brandColors } from "@/constants/branding";
import { getTabDefinition, VISIBLE_TAB_ORDER, type VisibleTabName } from "@/lib/tabs";
import {
  CENTER_PLUS_ICON_SIZE,
  CENTER_PLUS_OFFSET,
  CENTER_PLUS_SHADOW,
  CENTER_PLUS_SIZE,
  TAB_BAR_BOTTOM_MARGIN,
  TAB_BAR_CAPSULE_SHADOW,
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_CORNER_RADIUS,
  TAB_BAR_HORIZONTAL_MARGIN,
} from "@/lib/tab-bar";

/**
 * Floating rounded capsule tab bar — Discover · Feed · + · Bites · Profile.
 * Center + opens the guided Add a Bite modal.
 */
export function PickyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const resolved = useThemeStore((s) => s.resolved);
  const colors = themeColors[resolved];
  const plusFill = resolved === "dark" ? brandColors.primaryOnDark : brandColors.primary;
  const surface = resolved === "dark" ? colors.tabBar : brandColors.surface;
  const border = resolved === "dark" ? colors.border : brandColors.border;

  const visibleRoutes = VISIBLE_TAB_ORDER.map((name) => {
    const route = state.routes.find((r) => r.name === name);
    return route ? { name, route } : null;
  }).filter(Boolean) as { name: VisibleTabName; route: (typeof state.routes)[number] }[];

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, TAB_BAR_BOTTOM_MARGIN),
          paddingHorizontal: TAB_BAR_HORIZONTAL_MARGIN,
        },
      ]}
    >
      <View
        style={[
          styles.capsule,
          {
            height: TAB_BAR_CONTENT_HEIGHT,
            backgroundColor: surface,
            borderColor: border,
            ...TAB_BAR_CAPSULE_SHADOW,
            shadowOpacity: resolved === "dark" ? 0.35 : TAB_BAR_CAPSULE_SHADOW.shadowOpacity,
          },
        ]}
      >
        <View style={styles.row}>
          {visibleRoutes.map(({ name, route }) => {
            const def = getTabDefinition(name);
            if (!def) return null;

            const index = state.routes.findIndex((r) => r.key === route.key);
            const focused = state.index === index;
            const color = focused ? colors.tabActive : colors.tabInactive;
            const options = descriptors[route.key]?.options;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (event.defaultPrevented) return;

              if (def.isCenterAction) {
                hapticMedium();
                router.push("/add-bite");
                return;
              }

              hapticSelection();

              if (!focused) {
                navigation.dispatch({
                  ...CommonActions.navigate(route.name, route.params),
                  target: state.key,
                });
              }
            };

            if (def.isCenterAction) {
              return (
                <View key={route.key} style={styles.slot} pointerEvents="box-none">
                  <PlatformPressable
                    accessibilityRole="button"
                    accessibilityLabel={options?.tabBarAccessibilityLabel ?? "Add a Bite"}
                    accessibilityState={focused ? { selected: true } : {}}
                    testID={options?.tabBarButtonTestID}
                    pressOpacity={0.85}
                    onPress={onPress}
                    style={styles.plusPressable}
                  >
                    <View style={[styles.plusButton, { backgroundColor: plusFill }]}>
                      <Ionicons name="add" size={CENTER_PLUS_ICON_SIZE} color="#FFFFFF" />
                    </View>
                  </PlatformPressable>
                </View>
              );
            }

            const iconName = focused ? def.icon.focused : def.icon.unfocused;

            return (
              <PlatformPressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={options?.tabBarAccessibilityLabel ?? def.title}
                accessibilityState={focused ? { selected: true } : {}}
                testID={options?.tabBarButtonTestID}
                pressOpacity={0.85}
                onPress={onPress}
                style={styles.slot}
              >
                <View
                  style={[
                    styles.iconWrap,
                    focused && { backgroundColor: brandColors.primaryLight },
                  ]}
                >
                  <Ionicons name={iconName} size={22} color={color} />
                </View>
                <Text style={[styles.label, { color }]} numberOfLines={1}>
                  {def.title}
                </Text>
              </PlatformPressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  capsule: {
    borderRadius: TAB_BAR_CORNER_RADIUS,
    borderWidth: Platform.OS === "ios" ? StyleSheet.hairlineWidth : 1,
    overflow: "visible",
    justifyContent: "center",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  plusPressable: {
    marginTop: -CENTER_PLUS_OFFSET,
    width: CENTER_PLUS_SIZE,
    height: CENTER_PLUS_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  plusButton: {
    width: CENTER_PLUS_SIZE,
    height: CENTER_PLUS_SIZE,
    borderRadius: CENTER_PLUS_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    ...CENTER_PLUS_SHADOW,
  },
});
