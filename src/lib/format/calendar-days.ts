// Calendar-day arithmetic for "YYYY-MM-DD" strings (and "YYYY-MM" months). It runs in UTC, so no time
// zone ever shifts a day. Formatting for people is in ./index.ts.
import { createParser } from "nuqs/server";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const toUtc = (day: string) => {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
};
const fromUtc = (date: Date) => date.toISOString().slice(0, 10);

export const addDays = (day: string, days: number) => {
  const date = toUtc(day);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtc(date);
};

/** 0 for Monday … 6 for Sunday (weeks run Monday to Sunday). */
export const weekdayIndex = (day: string) => (toUtc(day).getUTCDay() + 6) % 7;

/** Monday to Sunday of the week holding `day`. */
export function weekRange(day: string): { from: string; to: string } {
  const from = addDays(day, -weekdayIndex(day));
  return { from, to: addDays(from, 6) };
}

/** "2026-10" for "2026-10-01". */
export const monthOf = (day: string) => day.slice(0, 7);

export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return fromUtc(new Date(Date.UTC(y, m - 1 + by, 1))).slice(0, 7);
}

/** A calendar day in the URL ("2026-10-01"); anything else is ignored. */
export const parseAsIsoDay = createParser({
  parse: (v) => (ISO_DAY.test(v) ? v : null),
  serialize: (v: string) => v,
});

/** A month in the URL ("2026-10"). */
export const parseAsIsoMonth = createParser({
  parse: (v) => (/^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : null),
  serialize: (v: string) => v,
});
