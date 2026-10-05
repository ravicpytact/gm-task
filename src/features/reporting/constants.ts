import { parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";
import { parseAsIsoDay, parseAsIsoMonth } from "@/lib/format";
import type { RangeType } from "./types";

/** Permission codes this feature checks (docs/04-design/acm). The backend enforces them. */
export const REPORT_PERMISSIONS = {
  readAll: "reporting.report.read_all",
  readOwn: "reporting.report.read_own",
} as const;

export const RANGE_TYPES: RangeType[] = ["DAY", "WEEK", "MONTH", "CUSTOM"];
export const RANGE_LABELS: Record<RangeType, string> = {
  DAY: "Today",
  WEEK: "Week",
  MONTH: "Month",
  CUSTOM: "Range",
};

export const REPORT_PAGE_SIZE = 20;

/**
 * What the Report shows lives in the URL (FE-DATA-004). Without a day, week or month the server's
 * current one is used, so "today" never depends on the browser's clock.
 */
export const reportParsers = {
  range: parseAsStringLiteral(RANGE_TYPES).withDefault("DAY"),
  day: parseAsIsoDay,
  week: parseAsIsoDay,
  month: parseAsIsoMonth,
  from: parseAsIsoDay,
  to: parseAsIsoDay,
  user: parseAsString,
  page: parseAsInteger.withDefault(1),
};

export const STATUS_TEXT: Record<string, string> = {
  PENDING: "Pending",
  COMPLETE: "Complete",
  NO_TASK: "No Task",
};

export const REPORT_LEGEND =
  "T = Total, C = Completed (includes No), N = answered No, P = Pending, S = Status";
