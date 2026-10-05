import { parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";
import { parseAsIsoDay } from "@/lib/format";
import type { AssignmentSortField, AssignmentStatusFilter, Frequency, Weekday } from "./types";

/** Permission codes this feature checks (docs/04-design/acm). The backend enforces them. */
export const ASSIGNMENT_PERMISSIONS = {
  readAll: "assignments.assignment.read_all",
  create: "assignments.assignment.create",
  update: "assignments.assignment.update",
  copy: "assignments.assignment.copy",
} as const;

/** History: everyone's (Admins) or only one's own. */
export const HISTORY_PERMISSIONS = {
  readAll: "assignments.history.read_all",
} as const;

export const FREQUENCIES: Frequency[] = [
  "DAILY",
  "WEEKLY",
  "EVERY_15_DAYS",
  "MONTHLY",
  "QUARTERLY",
  "SIX_MONTHS",
  "YEARLY",
];
export const FREQUENCY_LABELS: Record<Frequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  EVERY_15_DAYS: "15 Days",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  SIX_MONTHS: "Six Months",
  YEARLY: "Yearly",
};

export const WEEKDAYS: Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

export const STATUS_FILTERS: AssignmentStatusFilter[] = ["ACTIVE", "ENDED", "ALL"];
export const STATUS_FILTER_LABELS: Record<AssignmentStatusFilter, string> = {
  ACTIVE: "Active",
  ENDED: "Ended",
  ALL: "All",
};

export const ASSIGNMENTS_PAGE_SIZE = 20;
const SORT_FIELDS: AssignmentSortField[] = ["user_name", "task_name", "start_date", "created_at"];

/**
 * What the Assignment List shows lives in the URL (FE-DATA-004). User and task are ids: they have
 * no stable code, and the link is meant for this environment's data anyway.
 */
export const assignmentListParsers = {
  page: parseAsInteger.withDefault(1),
  user: parseAsString,
  task: parseAsString,
  frequency: parseAsStringLiteral(FREQUENCIES),
  status: parseAsStringLiteral(STATUS_FILTERS).withDefault("ACTIVE"),
  sort: parseAsStringLiteral(SORT_FIELDS).withDefault("user_name"),
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc"),
};

/** The contract's words (docs/04-design/assignments/ui_data_contract.md). */
export const ASSIGNMENT_MESSAGES = {
  PRECONDITION_FAILED: "This assignment was changed by someone else. Refresh and try again.",
};

// --- My Todos, calendar and history ----------------------------------------------------------

// Calendar days in the URL: parseAsIsoDay (lib/format).

export const TODOS_PAGE_SIZE = 20;

/**
 * The dashboard's Todo list (contract §1–2). No date means today as the server counts it, so the
 * default never depends on the browser's clock.
 */
export const todoListParsers = {
  date: parseAsIsoDay,
  frequency: parseAsStringLiteral(FREQUENCIES),
  search: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const HISTORY_PAGE_SIZE = 20;

/** History (contract §4–5). No range means the current week (the backend's default too). */
export const historyParsers = {
  from: parseAsIsoDay,
  to: parseAsIsoDay,
  // History (all users), Admin only: one person, or everyone.
  user: parseAsString,
  task: parseAsString,
  frequency: parseAsStringLiteral(FREQUENCIES),
  page: parseAsInteger.withDefault(1),
};

export const TODO_MESSAGES = {
  TODO_ALREADY_COMPLETED: "This Todo was already answered.",
  TODO_NOT_FOUND: "This Todo is no longer there.",
};

/** The "Other" choice of a Number Todo, while its value is being typed (never sent as such). */
export const OTHER_CHOICE = "__other__";
