import type { inferParserType } from "nuqs/server";
import { addDays, formatDate, formatMonth, monthOf, shiftMonth } from "@/lib/format";
import { REPORT_PAGE_SIZE, reportParsers } from "./constants";
import type { MyReportQuery, ReportQuery, ReportRange } from "./types";

export type ReportParams = inferParserType<typeof reportParsers>;

/** The own report's query: only the field of the chosen range type is sent (a plain literal). */
export function toMyReportQuery(params: ReportParams): MyReportQuery {
  const range = params.range;
  return {
    range_type: range,
    day: range === "DAY" ? (params.day ?? undefined) : undefined,
    week_start: range === "WEEK" ? (params.week ?? undefined) : undefined,
    month: range === "MONTH" ? (params.month ?? undefined) : undefined,
    date_from: range === "CUSTOM" ? (params.from ?? undefined) : undefined,
    date_to: range === "CUSTOM" ? (params.to ?? undefined) : undefined,
  };
}

export function toReportQuery(params: ReportParams): ReportQuery {
  return {
    ...toMyReportQuery(params),
    user_id: params.user ?? undefined,
    page: params.page,
    page_size: REPORT_PAGE_SIZE,
  };
}

/** A custom range needs both days, in order; until then nothing is asked of the server. */
export function rangeProblem(params: ReportParams): string | null {
  if (params.range !== "CUSTOM") return null;
  if (!params.from || !params.to) return "Choose the start and end dates.";
  if (params.from > params.to) return "The start date must be on or before the end date.";
  return null;
}

/** "28 Sep – 04 Oct 2026"; the year only once when both days share it. */
function span(from: string, to: string): string {
  const start = formatDate(from);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${sameYear ? start.slice(0, 6) : start} – ${formatDate(to)}`;
}

/** The header line (contract §1): "Day: 01 Oct 2026", "Week: 28 Sep – 04 Oct 2026", … */
export function rangeHeader(range: ReportRange): string {
  if (range.range_type === "DAY") return `Day: ${formatDate(range.date_from)}`;
  if (range.range_type === "WEEK") return `Week: ${span(range.date_from, range.date_to)}`;
  if (range.range_type === "MONTH") return `Month: ${formatMonth(monthOf(range.date_from))}`;
  return `Range: ${span(range.date_from, range.date_to)}`;
}

/** The URL change for the previous (-1) or next (+1) day, week or month. */
export function stepRange(range: ReportRange, by: number): Partial<ReportParams> {
  if (range.range_type === "DAY") return { day: addDays(range.date_from, by) };
  if (range.range_type === "WEEK") return { week: addDays(range.date_from, 7 * by) };
  return { month: shiftMonth(monthOf(range.date_from), by) };
}

/** Whether the range shown holds today (the previous/next buttons offer a way back). */
export const includesToday = (range: ReportRange) =>
  range.date_from <= range.today && range.today <= range.date_to;
