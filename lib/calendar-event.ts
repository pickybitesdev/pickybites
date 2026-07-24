import { Linking, Alert } from "react-native";
import { buildGoogleCalendarUrl } from "@/lib/plan-visit";

export async function addPlanToCalendar(opts: {
  placeName: string;
  dateIso: string;
  timeHhmm: string;
  address?: string;
  city?: string;
}): Promise<boolean> {
  const location = [opts.address, opts.city].filter(Boolean).join(", ");
  const url = buildGoogleCalendarUrl({
    title: `Dinner at ${opts.placeName}`,
    dateIso: opts.dateIso,
    timeHhmm: opts.timeHhmm,
    details: `Planned on PickyBites — ${opts.placeName}`,
    location: location || undefined,
  });

  try {
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert("Calendar", "Could not open your calendar app.");
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert("Calendar", "Could not open your calendar app.");
    return false;
  }
}
