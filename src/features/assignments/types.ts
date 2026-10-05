import type { Operations, Schemas } from "@/lib/api";

export type Assignment = Schemas["AssignmentRead"];
export type AssignmentCreate = Schemas["AssignmentCreate"];
export type AssignmentUpdate = Schemas["AssignmentUpdate"];
export type AssignResult = Schemas["AssignResultRead"];
export type CopyRequest = Schemas["CopyRequest"];
export type CopyResult = Schemas["CopyResultRead"];

export type AssignmentListQuery = NonNullable<
  Operations["list_assignments_v1_assignments_get"]["parameters"]["query"]
>;
export type DueDatesQuery =
  Operations["due_dates_preview_v1_assignments_due_dates_preview_get"]["parameters"]["query"];

export type Frequency = AssignmentCreate["frequency"];
export type Weekday = AssignmentCreate["weekdays"][number];
export type AssignmentStatusFilter = NonNullable<AssignmentListQuery["status"]>;
export type AssignmentSortField = NonNullable<AssignmentListQuery["sort_by"]>;

// My Todos, the dashboard counts, the calendar and history (contract §1–4).
export type Todo = Schemas["TodoRead"];
export type TodoAnswer = Schemas["TodoAnswer"];
export type TodoSummary = Schemas["SummaryRead"];
export type TodoCalendar = Schemas["CalendarRead"];
export type HistoryItem = Schemas["HistoryItemRead"];
export type MyTask = Schemas["HistoryTaskRead"];
export type TodoListQuery = NonNullable<
  Operations["my_todos_v1_me_todos_get"]["parameters"]["query"]
>;
export type MyHistoryQuery = NonNullable<
  Operations["my_history_v1_me_history_get"]["parameters"]["query"]
>;
export type AllHistoryQuery = NonNullable<
  Operations["all_history_v1_history_get"]["parameters"]["query"]
>;
