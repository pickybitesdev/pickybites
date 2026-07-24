import { Alert, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { assertSafeHttpsUrl } from "./url";
import { shareIntakeUserMessage } from "./errors";

export async function openOriginalSource(url: string | null | undefined): Promise<boolean> {
  if (!url?.trim()) {
    Alert.alert("Link", shareIntakeUserMessage("SOURCE_EXPIRED"));
    return false;
  }
  let safe: string;
  try {
    safe = assertSafeHttpsUrl(url);
  } catch {
    Alert.alert("Link", shareIntakeUserMessage("INVALID_URL"));
    return false;
  }

  try {
    const can = await Linking.canOpenURL(safe);
    if (can) {
      await Linking.openURL(safe);
      return true;
    }
  } catch {
    // fall through to browser
  }

  try {
    await WebBrowser.openBrowserAsync(safe);
    return true;
  } catch {
    Alert.alert("Link", shareIntakeUserMessage("SOURCE_EXPIRED"));
    return false;
  }
}
