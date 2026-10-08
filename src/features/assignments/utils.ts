import type { inferParserType } from "nuqs/server";
import {
  addDays,
  formatDate,
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
  MY_TASKS_PAGE_SIZE,
  OTHER_CHOICE,
  TODOS_PAGE_SIZE,
  WEEKDAY_LABELS,
  WEEKDAYS,
  assignmentListParsers,
  detailParsers,
  historyParsers,
  myTaskHistoryParsers,
  myTasksParsers,
  todoListParsers,
} from "./constants";
import type {
  AssignResult,
  Assignment,
  AllHistoryQuery,
  AssignmentListQuery,
  CopyResult,
  Frequency,
  MyAssignmentListQuery,
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

// --- Detail pages and My tasks ----------------------------------------------------------------

/** Whose detail page: User Detail lists one person's assignments, Task Detail one task's. */
export type DetailScope = { kind: "user"; userId: string } | { kind: "task"; taskId: string };

export type DetailParams = inferParserType<typeof detailParsers>;
/** A change to the URL: `null` clears a value (back to its default). */
export type DetailChanges = { [K in keyof DetailParams]?: DetailParams[K] | null };

/** The Assignments tab: the Assignment List query, fixed to this person or task. */
export function toDetailAssignmentQuery(
  params: DetailParams,
  scope: DetailScope,
): AssignmentListQuery {
  return {
    page: params.page,
    page_size: ASSIGNMENTS_PAGE_SIZE,
    status: params.status,
    frequency: params.frequency ?? undefined,
    user_id: scope.kind === "user" ? scope.userId : undefined,
    task_id: scope.kind === "task" ? scope.taskId : undefined,
    // By the other side: a person's tasks by name, a task's people by name.
    sort_by: scope.kind === "user" ? "task_name" : "user_name",
    sort_order: "asc",
  };
}

/** The History tab: History (all users) fixed to this person or task; without a range, this week. */
export function toDetailHistoryQuery(
  params: DetailParams,
  scope: DetailScope,
  today: string,
): AllHistoryQuery {
  const week = weekRange(today);
  return {
    date_from: params.from ?? week.from,
    date_to: params.to ?? week.to,
    frequency: params.frequency ?? undefined,
    user_id: scope.kind === "user" ? scope.userId : (params.user ?? undefined),
    task_id: scope.kind === "task" ? scope.taskId : (params.task ?? undefined),
    page: params.page,
    page_size: HISTORY_PAGE_SIZE,
  };
}

export type MyTasksParams = inferParserType<typeof myTasksParsers>;

export function toMyAssignmentListQuery(params: MyTasksParams): MyAssignmentListQuery {
  return { status: params.status, page: params.page, page_size: MY_TASKS_PAGE_SIZE };
}

export type MyTaskHistoryParams = inferParserType<typeof myTaskHistoryParsers>;

/** My Task Detail's history: every assignment I have had of this task (contract §12). */
export function toMyTaskHistoryQuery(
  params: MyTaskHistoryParams,
  taskId: string,
  today: string,
): MyHistoryQuery {
  const week = weekRange(today);
  return {
    date_from: params.from ?? week.from,
    date_to: params.to ?? week.to,
    task_id: taskId,
    page: params.page,
    page_size: HISTORY_PAGE_SIZE,
  };
}

/** The next due day: "Today" when it is today; `null` when there is none (ended). */
export function nextDueLabel(dates: readonly string[], today: string): string | null {
  const next = dates[0];
  if (!next) return null;
  return next === today ? "Today" : formatDate(next);
}

/** "Active", or "Ended on 30 Sep 2026 (de-assigned)" (contract §12). */
export function endedText(
  assignment: Pick<Assignment, "status" | "ended_reason" | "ended_on">,
): string {
  if (assignment.status === "ACTIVE" || !assignment.ended_on) return statusText(assignment);
  const reason =
    assignment.ended_reason === "DEASSIGNED"
      ? " (de-assigned)"
      : assignment.ended_reason === "END_DATE_PASSED"
        ? " (end date passed)"
        : "";
  return `Ended on ${formatDate(assignment.ended_on)}${reason}`;
}

/** My Task Detail (contract §12). */
export const myTaskPath = (assignmentId: string) => `/my-tasks/${assignmentId}`;
