import type { inferParserType } from "nuqs/server";
import {
  addDays,
  formatWeekdayDate,
  monthOf,
  toApiDate,
  weekRange,
  weekdayIndex,
} from "@/lib/format";
import {
  ASSIGNMENTS_PAGE_SIZE,
  FREQUENCY_LABELS,
  HISTORY_PAGE_SIZE,
  OTHER_CHOICE,
  TODOS_PAGE_SIZE,
  WEEKDAY_LABELS,
  WEEKDAYS,
  assignmentListParsers,
  historyParsers,
  todoListParsers,
} from "./constants";
import type {
  AssignResult,
  Assignment,
  AllHistoryQuery,
  AssignmentListQuery,
  CopyResult,
  Frequency,
  MyHistoryQuery,
  TodoAnswer,
  TodoListQuery,
  Weekday,
} from "./types";
import { otherAnswerSchema, timeAnswerSchema } from "./schemas";

export type AssignmentListParams = inferParserType<typeof assignmentListParsers>;

/** The backend query an Assignment List URL asks for (a plain literal: see nextjs-api-client). */
export function toAssignmentListQuery(params: AssignmentListParams): AssignmentListQuery {
  return {
    page: params.page,
    page_size: ASSIGNMENTS_PAGE_SIZE,
    status: params.status,
    sort_by: params.sort,
    sort_order: params.order,
    user_id: params.user ?? undefined,
    task_id: params.task ?? undefined,
    frequency: params.frequency ?? undefined,
  };
}

/** "Weekly (Mon, Thu)", "Daily". Weekdays in week order whatever order they came in. */
export function frequencyText(frequency: string, weekdays: readonly string[]): string {
  const label = FREQUENCY_LABELS[frequency as Frequency] ?? frequency;
  if (frequency !== "WEEKLY" || weekdays.length === 0) return label;
  const days = WEEKDAYS.filter((d) => weekdays.includes(d)).map((d) => WEEKDAY_LABELS[d]);
  return `${label} (${days.join(", ")})`;
}

/** Active / Ended (de-assigned) / Ended (end date passed) — contract §6. */
export function statusText(assignment: Pick<Assignment, "status" | "ended_reason">): string {
  if (assignment.status === "ACTIVE") return "Active";
  if (assignment.ended_reason === "DEASSIGNED") return "Ended (de-assigned)";
  if (assignment.ended_reason === "END_DATE_PASSED") return "Ended (end date passed)";
  return "Ended";
}

/** Change end date is offered while active, or after the end date passed (not after de-assign). */
export function canChangeEndDate(assignment: Pick<Assignment, "status" | "ended_reason">): boolean {
  return assignment.status === "ACTIVE" || assignment.ended_reason === "END_DATE_PASSED";
}

/** "Next: Thu 01 Oct, Mon 05 Oct, Thu 08 Oct" (from the server's rules). */
export function nextDueText(dates: readonly string[]): string {
  return dates.length ? `Next: ${dates.map(formatWeekdayDate).join(", ")}` : "No upcoming dates.";
}

/** Today as the backend counts it (IST), for date inputs' minimum and defaults. */
export const todayIso = () => toApiDate(new Date());

export const personName = (p: { first_name: string; last_name: string }) =>
  `${p.first_name} ${p.last_name}`;

/** "Assigned to 18 users. Skipped 2 who already have this task: Ravi, Shahid." (contract §7) */
export function assignResultText(result: AssignResult): string {
  const assigned = result.created.length;
  const skipped = result.skipped.length;
  const parts = [
    assigned === 0
      ? "No one was assigned."
      : `Assigned to ${assigned} ${assigned === 1 ? "user" : "users"}.`,
  ];
  if (skipped > 0) {
    const names = result.skipped.map((s) => s.first_name).join(", ");
    const verb = skipped === 1 ? "has" : "have";
    parts.push(`Skipped ${skipped} who already ${verb} this task: ${names}.`);
  }
  return parts.join(" ");
}

/** "Shahid: 3 copied, 1 skipped (Wake-up)" (contract §10, step 3) */
export function copyResultText(target: CopyResult["targets"][number]): string {
  const skipped = target.skipped.length
    ? `${target.skipped.length} skipped (${target.skipped.map((s) => s.task_name).join(", ")})`
    : "0 skipped";
  return `${target.first_name}: ${target.copied.length} copied, ${skipped}`;
}

/** Weekdays in week order, for requests and comparisons. */
export const sortWeekdays = (days: readonly Weekday[]) => WEEKDAYS.filter((d) => days.includes(d));

// --- My Todos, calendar and history ----------------------------------------------------------
// Calendar days are "YYYY-MM-DD" strings. The arithmetic runs in UTC, so no time zone shifts them.

// The arithmetic itself is shared (lib/format/calendar-days).
export { addDays, monthOf, shiftMonth, weekRange } from "@/lib/format";

/** The month as weeks of seven days, Monday first; `null` pads days outside the month. */
export function calendarWeeks(month: string): (string | null)[][] {
  const first = `${month}-01`;
  const lead = weekdayIndex(first);
  const days: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = first; monthOf(day) === month; day = addDays(day, 1)) days.push(day);
  while (days.length % 7) days.push(null);
  return Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7));
}

export type TodoListParams = inferParserType<typeof todoListParsers>;

export function toTodoListQuery(params: TodoListParams): TodoListQuery {
  return {
    date: params.date ?? undefined,
    frequency: params.frequency ?? undefined,
    search: params.search || undefined,
    page: params.page,
    page_size: TODOS_PAGE_SIZE,
  };
}

export type HistoryParams = inferParserType<typeof historyParsers>;

/** The history query; without a range, the week of `today`. */
export function toHistoryQuery(params: HistoryParams, today: string): MyHistoryQuery {
  const week = weekRange(today);
  return {
    date_from: params.from ?? week.from,
    date_to: params.to ?? week.to,
    task_id: params.task ?? undefined,
    frequency: params.frequency ?? undefined,
    page: params.page,
    page_size: HISTORY_PAGE_SIZE,
  };
}

/** History (all users): the same, plus one person or everyone (contract §5). */
export function toAllHistoryQuery(params: HistoryParams, today: string): AllHistoryQuery {
  return { ...toHistoryQuery(params, today), user_id: params.user ?? undefined };
}

type AnswerOptions = { type: string; options: { value: string; label: string }[] };

/** An answer as words: "Yes", "Average", "06:30", "3", "10 (Other)" (contract §4). */
export function answerText(
  answer: { response_value: string; is_other: boolean },
  type: AnswerOptions | undefined,
): string {
  if (answer.is_other) return `${answer.response_value} (Other)`;
  return (
    type?.options.find((o) => o.value === answer.response_value)?.label ?? answer.response_value
  );
}

// --- Answer drafts: chosen on screen, sent together by Submit -----------------------------------

/** What someone has chosen or typed for one Todo, before Submit. */
export type AnswerDraft = {
  /** The task type, so a draft can be checked and sent from any day or page of the list. */
  taskType: string;
  choice: string | null;
  text: string;
};

type AnswerType = { accepts_time: boolean };

export type DraftResult =
  { state: "empty" } | { state: "invalid"; message: string } | { state: "ready"; body: TodoAnswer };

/**
 * A draft as an answer to send (contract §3). A choice is ready at once; Time and Other need a
 * value, checked by the same rules as the backend's.
 */
export function draftAnswer(
  draft: AnswerDraft | undefined,
  type: AnswerType | undefined,
): DraftResult {
  if (!draft || !type) return { state: "empty" };
  const typed = type.accepts_time || draft.choice === OTHER_CHOICE;
  if (!typed) {
    return draft.choice
      ? { state: "ready", body: { response_value: draft.choice, is_other: false } }
      : { state: "empty" };
  }
  if (!draft.text.trim()) return { state: "empty" };
  const parsed = (type.accepts_time ? timeAnswerSchema : otherAnswerSchema).safeParse(draft.text);
  return parsed.success
    ? { state: "ready", body: { response_value: parsed.data, is_other: !type.accepts_time } }
    : { state: "invalid", message: parsed.error.issues[0]?.message ?? "Check this answer." };
}
