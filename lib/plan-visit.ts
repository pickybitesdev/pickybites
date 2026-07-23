/** Plan-a-visit date helpers for Try Next → Planned. */

export type PlanVisitPresetId = "tonight" | "tomorrow" | "weekend" | "next_week";

export type PlanVisitPreset = {
  id: PlanVisitPresetId;
  label: string;
  /** Local calendar date YYYY-MM-DD */
  date: string;
};

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

/** Next Saturday (or today if Saturday). */
function nextWeekend(from = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const day = d.getDay(); // 0 Sun … 6 Sat
  if (day === 6) return d;
  const delta = (6 - day + 7) % 7 || 7;
  return addDays(d, delta);
}

export function planVisitPresets(now = new Date()): PlanVisitPreset[] {
  return [
    { id: "tonight", label: "Tonight", date: toIsoDate(now) },
    { id: "tomorrow", label: "Tomorrow", date: toIsoDate(addDays(now, 1)) },
    { id: "weekend", label: "This weekend", date: toIsoDate(nextWeekend(now)) },
    { id: "next_week", label: "Next week", date: toIsoDate(addDays(now, 7)) },
  ];
}

/** Store plannedAt as noon UTC on that local date so the calendar day stays stable. */
export function plannedAtFromIsoDate(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return new Date().toISOString();
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)).toISOString();
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return false;
  const t = Date.parse(`${value.trim()}T12:00:00`);
  return Number.isFinite(t);
}

export function formatPlanDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** YYYYMMDD for all-day Google Calendar events. */
export function toCalendarDayStamp(isoDateOrTs: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDateOrTs)) {
    return isoDateOrTs.replace(/-/g, "");
  }
  const d = new Date(isoDateOrTs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function nextCalendarDayStamp(dayStamp: string): string {
  const y = Number(dayStamp.slice(0, 4));
  const m = Number(dayStamp.slice(4, 6));
  const d = Number(dayStamp.slice(6, 8));
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const yy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(next.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

export function buildGoogleCalendarUrl(opts: {
  title: string;
  dateIso: string;
  details?: string;
  location?: string;
}): string {
  const start = toCalendarDayStamp(opts.dateIso);
  const end = nextCalendarDayStamp(start);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${start}/${end}`,
  });
  if (opts.details) params.set("details", opts.details);
  if (opts.location) params.set("location", opts.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
