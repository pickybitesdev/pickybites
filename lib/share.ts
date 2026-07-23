import { Alert, Share, Linking, Platform } from "react-native";
import { APP_NAME, APP_SCHEME } from "@/constants/branding";

const INVITE_TEXT = `Join me on ${APP_NAME} — rate restaurants, find your taste match, and discover spots your friends love.`;

export const DIRECTIONS_UNAVAILABLE_MESSAGE = "Directions are unavailable for this restaurant.";

export function restaurantDeepLink(restaurantId: string) {
  return `${APP_SCHEME}://restaurant/${restaurantId}`;
}

export function userDeepLink(userId: string) {
  return `${APP_SCHEME}://user/${userId}`;
}

export function signupDeepLink() {
  return `${APP_SCHEME}://signup`;
}

export async function shareInvite(displayName?: string) {
  const link = signupDeepLink();
  const message = displayName
    ? `${displayName} invited you to ${APP_NAME}!\n\n${INVITE_TEXT}\n\nJoin: ${link}`
    : `${INVITE_TEXT}\n\nJoin: ${link}`;
  await Share.share({ message, title: `Invite to ${APP_NAME}`, url: link });
}

export async function shareRestaurant(
  restaurantId: string,
  name: string,
  cuisine: string,
  city: string,
  rating?: number,
) {
  const link = restaurantDeepLink(restaurantId);
  const ratingLine = rating != null ? ` Rated ${rating.toFixed(1)}/10 on ${APP_NAME}.` : "";
  await Share.share({
    message: `Check out ${name} (${cuisine}) in ${city} on ${APP_NAME}!${ratingLine}\n\n${link}`,
    title: name,
    url: link,
  });
}

/** Share a place before it has a persisted restaurant id (no deep link). */
export async function sharePlacePreview(
  name: string,
  cuisine: string,
  city: string,
  address?: string | null,
) {
  const loc = [city, address].filter((x) => x && String(x).trim()).join(" · ");
  await Share.share({
    message: `Check out ${name}${cuisine ? ` (${cuisine})` : ""}${loc ? ` in ${loc}` : ""} on ${APP_NAME}.`,
    title: name,
  });
}

export async function shareReview(
  displayName: string,
  restaurantId: string,
  restaurantName: string,
  rating: number,
  text: string,
) {
  const link = restaurantDeepLink(restaurantId);
  const excerpt = text.trim() ? `"${text.trim().slice(0, 120)}${text.length > 120 ? "…" : ""}"` : "";
  await Share.share({
    message: `${displayName} rated ${restaurantName} ${rating.toFixed(1)}/10 on ${APP_NAME}.${excerpt ? ` ${excerpt}` : ""}\n\n${link}`,
    title: `${restaurantName} on ${APP_NAME}`,
    url: link,
  });
}

export type RestaurantDirectionsInput = {
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
};

export function hasValidCoordinates(
  latitude?: number | null,
  longitude?: number | null,
): latitude is number {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

/** Build a platform maps URL; returns null when neither coords nor address are usable. */
export function buildRestaurantDirectionsUrl(input: RestaurantDirectionsInput): string | null {
  const label = input.name?.trim() || undefined;

  if (hasValidCoordinates(input.latitude, input.longitude)) {
    const lat = input.latitude;
    const lng = input.longitude;
    const q = label ? encodeURIComponent(label) : `${lat},${lng}`;
    return (
      Platform.select({
        ios: `maps:0,0?q=${q}@${lat},${lng}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${q})`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      }) ?? null
    );
  }

  const query = [input.name, input.address]
    .map((x) => (x ?? "").trim())
    .filter(Boolean)
    .join(", ");
  if (!query) return null;
  const encoded = encodeURIComponent(query);
  return (
    Platform.select({
      ios: `maps:0,0?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    }) ?? null
  );
}

export async function openRestaurantDirections(
  input: RestaurantDirectionsInput,
): Promise<boolean> {
  const url = buildRestaurantDirectionsUrl(input);
  if (!url) {
    Alert.alert("Directions", DIRECTIONS_UNAVAILABLE_MESSAGE);
    return false;
  }
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert("Directions", DIRECTIONS_UNAVAILABLE_MESSAGE);
    return false;
  }
}

export async function openInMaps(latitude: number, longitude: number, label?: string) {
  return openRestaurantDirections({ latitude, longitude, name: label });
}
