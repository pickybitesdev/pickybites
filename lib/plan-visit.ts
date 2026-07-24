/** Plan-a-visit date helpers for Try Next → Planned. */

export type PlanVisitPresetId = "tonight" | "tomorrow";

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

export function planVisitPresets(now = new Date()): PlanVisitPreset[] {
  return [
    { id: "tonight", label: "Tonight", date: toIsoDate(now) },
    { id: "tomorrow", label: "Tomorrow", date: toIsoDate(addDays(now, 1)) },
  ];
}

/** Local time HH:mm (24h). */
export type VisitTimeHhmm = string;

export const DEFAULT_VISIT_TIME = "12:00";

export function isValidVisitTime(value: string): boolean {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return false;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
}

export function visitTimeFromPlannedAt(iso: string | null | undefined): VisitTimeHhmm {
  if (!iso) return DEFAULT_VISIT_TIME;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return DEFAULT_VISIT_TIME;
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

export function formatVisitTimeLabel(timeHhmm: string): string {
  if (!isValidVisitTime(timeHhmm)) return timeHhmm;
  const [h, min] = timeHhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, min);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Local date + local time → ISO timestamp for plannedAt. */
export function plannedAtFromLocalDateTime(isoDate: string, timeHhmm: string): string {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  const tm = /^(\d{1,2}):(\d{2})$/.exec(timeHhmm.trim());
  if (!dm || !tm || !isValidIsoDate(isoDate) || !isValidVisitTime(timeHhmm)) {
    return new Date().toISOString();
  }
  const y = Number(dm[1]);
  const mo = Number(dm[2]);
  const d = Number(dm[3]);
  const h = Number(tm[1]);
  const min = Number(tm[2]);
  return new Date(y, mo - 1, d, h, min, 0, 0).toISOString();
}

export function formatPlanWhen(dateIso: string, timeHhmm: string): string {
  const iso = plannedAtFromLocalDateTime(dateIso, timeHhmm);
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return dateIso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function toCalendarDateTimeStamp(dateIso: string, timeHhmm: string): string {
  const [h, min] = timeHhmm.split(":");
  const day = dateIso.replace(/-/g, "");
  return `${day}T${h.padStart(2, "0")}${min.padStart(2, "0")}00`;
}

function addHoursToCalendarStamp(stamp: string, hours: number): string {
  const day = stamp.slice(0, 8);
  const h = Number(stamp.slice(9, 11));
  const m = Number(stamp.slice(11, 13));
  const endH = h + hours;
  return `${day}T${String(endH).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
}

export function buildGoogleCalendarUrl(opts: {
  title: string;
  dateIso: string;
  timeHhmm?: string;
  details?: string;
  location?: string;
}): string {
  const useTimed = opts.timeHhmm && isValidVisitTime(opts.timeHhmm);
  const start = useTimed
    ? toCalendarDateTimeStamp(opts.dateIso, opts.timeHhmm!)
    : toCalendarDayStamp(opts.dateIso);
  const end = useTimed ? addHoursToCalendarStamp(start, 2) : nextCalendarDayStamp(start);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${start}/${end}`,
  });
  if (opts.details) params.set("details", opts.details);
  if (opts.location) params.set("location", opts.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
