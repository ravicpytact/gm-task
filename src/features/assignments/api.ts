import { unwrap, unwrapWithEtag, type ApiClient } from "@/lib/api";
import type {
  AllHistoryQuery,
  AssignmentCreate,
  AssignmentListQuery,
  AssignmentUpdate,
  CopyRequest,
  DueDatesQuery,
  MyHistoryQuery,
  TodoAnswer,
  TodoListQuery,
} from "./types";

export const listAssignments = (api: ApiClient, query: AssignmentListQuery) =>
  unwrap(api.GET("/v1/assignments", { params: { query } }));

export const getAssignment = (api: ApiClient, assignmentId: string) =>
  unwrapWithEtag(
    api.GET("/v1/assignments/{assignment_id}", {
      params: { path: { assignment_id: assignmentId } },
    }),
  );

/** Assign a task to one, several or all active users; users who have it are skipped (ASG-R3). */
export const assignTask = (api: ApiClient, body: AssignmentCreate) =>
  unwrap(api.POST("/v1/assignments", { body }));

/** One change per request: frequency, end date, or de-assign. Sends the version it read. */
export const updateAssignment = (
  api: ApiClient,
  assignmentId: string,
  etag: string,
  body: AssignmentUpdate,
) =>
  unwrapWithEtag(
    api.PATCH("/v1/assignments/{assignment_id}", {
      params: { path: { assignment_id: assignmentId }, header: { "If-Match": etag } },
      body,
    }),
  );

/** With `dry_run: true` it only previews (Screen 24, step 2) and changes nothing. */
export const copyAssignments = (api: ApiClient, body: CopyRequest) =>
  unwrap(api.POST("/v1/assignments/copy", { body }));

/** The next due dates for a schedule, from the server's rules (never computed here). */
export const previewDueDates = (api: ApiClient, query: DueDatesQuery) =>
  unwrap(api.GET("/v1/assignments/due-dates-preview", { params: { query } }));

// --- My Todos, calendar, counts and history ---------------------------------------------------

/** Pending Todos only (completed ones are history). No date: today, as the server counts it. */
export const listMyTodos = (api: ApiClient, query: TodoListQuery) =>
  unwrap(api.GET("/v1/me/todos", { params: { query } }));

/** Pending Todos per frequency for one day; its `today` is how the app learns the server's day. */
export const getTodoSummary = (api: ApiClient, date: string | null) =>
  unwrap(api.GET("/v1/me/todos/summary", { params: { query: { date } } }));

export const getTodoCalendar = (api: ApiClient, month: string | null) =>
  unwrap(api.GET("/v1/me/todos/calendar", { params: { query: { month } } }));

/** Works once: a second answer is refused (409), there is no edit or undo. */
export const answerTodo = (api: ApiClient, todoId: string, body: TodoAnswer) =>
  unwrap(api.PATCH("/v1/me/todos/{todo_id}", { params: { path: { todo_id: todoId } }, body }));

export const listMyHistory = (api: ApiClient, query: MyHistoryQuery) =>
  unwrap(api.GET("/v1/me/history", { params: { query } }));

/** Admin: everyone's completed Todos, each with its person. */
export const listAllHistory = (api: ApiClient, query: AllHistoryQuery) =>
  unwrap(api.GET("/v1/history", { params: { query } }));

/** The tasks I have or had, for the Task filter of My History. */
export const listMyTasks = (api: ApiClient) => unwrap(api.GET("/v1/me/tasks"));

/** The calendar's year and month views: pending Todos per year, and per month of `year`. */
export const getPendingCounts = (api: ApiClient, year: number | null) =>
  unwrap(api.GET("/v1/me/todos/pending-counts", { params: { query: { year } } }));
