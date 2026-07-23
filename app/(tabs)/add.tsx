import { Redirect } from "expo-router";

/** Center + opens Add a Bite; this tab route redirects for deep links. */
export default function AddScreen() {
  return <Redirect href="/add-bite" />;
}
