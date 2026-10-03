// The only module that formats dates, times and numbers (FE-UI-008).
//
// Two kinds of value come from the backend:
// - a moment, an ISO timestamp in UTC ("2026-10-01T04:00:00Z"): shown in DISPLAY_TIME_ZONE;
// - a calendar day ("2026-10-01"): shown as that day, never shifted by a time zone.
// Formatting uses a fixed zone, never the machine's, so server and browser render the same text.
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { DISPLAY_LOCALE, DISPLAY_TIME_ZONE } from "@/config/constants";

type DateInput = string | Date;

const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

function parts(value: DateInput, options: Intl.DateTimeFormatOptions) {
  const isDay = typeof value === "string" && CALENDAR_DAY.test(value);
  const date = typeof value === "string" ? new Date(isDay ? `${value}T00:00:00Z` : value) : value;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    ...options,
    timeZone: isDay ? "UTC" : DISPLAY_TIME_ZONE,
  });
  return Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
}

// Fixed, not from the locale: ICU writes September as "Sept" in some locales and versions.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** 01 Oct 2026 */
export function formatDate(value: DateInput): string {
  const p = parts(value, { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${p.day} ${MONTHS[Number(p.month) - 1]} ${p.year}`;
}

/** 09:30 AM */
export function formatTime(value: DateInput): string {
  const p = parts(value, { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${p.hour}:${p.minute} ${String(p.dayPeriod).toUpperCase()}`;
}

/** 01 Oct 2026, 09:30 AM */
export function formatDateTime(value: DateInput): string {
  return `${formatDate(value)}, ${formatTime(value)}`;
}

/** "3 days ago" (relative, so the zone does not matter) */
export function formatRelative(value: DateInput): string {
  return formatDistanceToNowStrict(typeof value === "string" ? parseISO(value) : value, {
    addSuffix: true,
  });
}

/** The backend's calendar-day format for query parameters: "2026-10-01" in DISPLAY_TIME_ZONE. */
export function toApiDate(value: Date): string {
  const p = parts(value, { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${p.year}-${p.month}-${p.day}`;
}

const numberFormat = new Intl.NumberFormat(DISPLAY_LOCALE);

/** 1,23,456 */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}
