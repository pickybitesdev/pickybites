/**
 * Lightweight analytics facade. Logs in development; wire PostHog/Sentry later.
 * Never log full private share URLs — only platform + domain.
 */

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export type ShareAnalyticsEvent =
  | "share_target_opened"
  | "share_received"
  | "source_platform_detected"
  | "restaurant_resolution_started"
  | "restaurant_resolution_resolved"
  | "restaurant_resolution_multiple"
  | "restaurant_resolution_failed"
  | "restaurant_changed"
  | "share_saved_to_try_next"
  | "share_saved_link_only"
  | "share_cancelled"
  | "share_continue_browsing"
  | "share_opened_in_app"
  | "original_source_opened"
  | "share_source_removed";

let sink: ((event: string, props?: AnalyticsProps) => void) | null = null;

export function setAnalyticsSink(fn: ((event: string, props?: AnalyticsProps) => void) | null) {
  sink = fn;
}

export function track(event: ShareAnalyticsEvent | string, props?: AnalyticsProps) {
  const sanitized = props
    ? Object.fromEntries(
        Object.entries(props).filter(([k]) => !/url|link|href/i.test(k) || k === "domain"),
      )
    : undefined;
  if (__DEV__) {
    console.info(`[analytics] ${event}`, sanitized ?? {});
  }
  try {
    sink?.(event, sanitized);
  } catch {
    // never throw from analytics
  }
}
