import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { browserApi } from "@/lib/api/browser";
import { invalidateAllExceptSession } from "@/lib/query/invalidate";
import {
  answerTodo,
  assignTask,
  copyAssignments,
  getAssignment,
  getPendingCounts,
  getTodoCalendar,
  getTodoSummary,
  listAssignments,
  listAllHistory,
  listMyHistory,
  listMyTasks,
  listMyTodos,
  previewDueDates,
  updateAssignment,
} from "./api";
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

export const assignmentKeys = {
  all: ["assignments"] as const,
  lists: () => [...assignmentKeys.all, "list"] as const,
  list: (query: AssignmentListQuery) => [...assignmentKeys.lists(), query] as const,
  details: () => [...assignmentKeys.all, "detail"] as const,
  detail: (id: string) => [...assignmentKeys.details(), id] as const,
  dueDates: (query: DueDatesQuery) => [...assignmentKeys.all, "due-dates", query] as const,
};

export const assignmentQueries = {
  list: (query: AssignmentListQuery) =>
    queryOptions({
      queryKey: assignmentKeys.list(query),
      queryFn: () => listAssignments(browserApi, query),
      placeholderData: keepPreviousData,
    }),
  /** One assignment with its version: read when a dialog opens, so a write sends a fresh ETag. */
  detail: (id: string) =>
    queryOptions({
      queryKey: assignmentKeys.detail(id),
      queryFn: () => getAssignment(browserApi, id),
      staleTime: 0,
    }),
  dueDates: (query: DueDatesQuery) =>
    queryOptions({
      queryKey: assignmentKeys.dueDates(query),
      queryFn: () => previewDueDates(browserApi, query),
      staleTime: 60_000,
      placeholderData: keepPreviousData, // keep the last preview while the next one loads
    }),
};

export const useAssignmentList = (query: AssignmentListQuery) =>
  useQuery(assignmentQueries.list(query));
export const useAssignment = (id: string | null) =>
  useQuery({ ...assignmentQueries.detail(id ?? ""), enabled: id !== null });
/** `null` while the schedule is incomplete: nothing is asked of the server. */
export const useDueDates = (query: DueDatesQuery | null) =>
  useQuery({
    ...assignmentQueries.dueDates(query ?? { frequency: "DAILY" }),
    enabled: query !== null,
  });

// Assigning, changing and copying create or remove Todos, which the dashboards, calendars, history
// and reports of the users involved show: refresh all server data (FE-DATA-003).

export function useAssignTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignmentCreate) => assignTask(browserApi, body),
    onSuccess: () => invalidateAllExceptSession(queryClient),
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; etag: string; body: AssignmentUpdate }) =>
      updateAssignment(browserApi, v.id, v.etag, v.body),
    onSuccess: (result, v) => {
      queryClient.setQueryData(assignmentKeys.detail(v.id), result);
      return invalidateAllExceptSession(queryClient);
    },
    onError: (error, v) => {
      if (error instanceof ApiError && error.status === 412) {
        void queryClient.invalidateQueries({ queryKey: assignmentKeys.detail(v.id) });
      }
    },
  });
}

/** The preview (`dry_run`) changes nothing, so only a real copy refreshes data. */
export function useCopyAssignments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CopyRequest) => copyAssignments(browserApi, body),
    onSuccess: (result) => (result.dry_run ? undefined : invalidateAllExceptSession(queryClient)),
  });
}

// --- My Todos, calendar, counts and history ---------------------------------------------------

export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (query: TodoListQuery) => [...todoKeys.lists(), query] as const,
  /** `null`: today, as the server counts it. */
  summary: (date: string | null) => [...todoKeys.all, "summary", date] as const,
  calendar: (month: string | null) => [...todoKeys.all, "calendar", month] as const,
  pendingCounts: (year: number | null) => [...todoKeys.all, "pending-counts", year] as const,
  history: (query: MyHistoryQuery) => [...todoKeys.all, "history", query] as const,
  allHistory: (query: AllHistoryQuery) => [...todoKeys.all, "history-all", query] as const,
  myTasks: () => [...todoKeys.all, "my-tasks"] as const,
};

export const todoQueries = {
  list: (query: TodoListQuery) =>
    queryOptions({
      queryKey: todoKeys.list(query),
      queryFn: () => listMyTodos(browserApi, query),
      placeholderData: keepPreviousData,
    }),
  summary: (date: string | null) =>
    queryOptions({
      queryKey: todoKeys.summary(date),
      queryFn: () => getTodoSummary(browserApi, date),
      placeholderData: keepPreviousData,
    }),
  calendar: (month: string | null) =>
    queryOptions({
      queryKey: todoKeys.calendar(month),
      queryFn: () => getTodoCalendar(browserApi, month),
      placeholderData: keepPreviousData,
    }),
  pendingCounts: (year: number | null) =>
    queryOptions({
      queryKey: todoKeys.pendingCounts(year),
      queryFn: () => getPendingCounts(browserApi, year),
      placeholderData: keepPreviousData,
    }),
  history: (query: MyHistoryQuery) =>
    queryOptions({
      queryKey: todoKeys.history(query),
      queryFn: () => listMyHistory(browserApi, query),
      placeholderData: keepPreviousData,
    }),
  allHistory: (query: AllHistoryQuery) =>
    queryOptions({
      queryKey: todoKeys.allHistory(query),
      queryFn: () => listAllHistory(browserApi, query),
      placeholderData: keepPreviousData,
    }),
  myTasks: () =>
    queryOptions({
      queryKey: todoKeys.myTasks(),
      queryFn: () => listMyTasks(browserApi),
      staleTime: 5 * 60_000,
    }),
};

export const useMyTodos = (query: TodoListQuery) => useQuery(todoQueries.list(query));
export const useTodoSummary = (date: string | null) => useQuery(todoQueries.summary(date));
export const useTodoCalendar = (month: string | null) => useQuery(todoQueries.calendar(month));
export const usePendingCounts = (year: number | null, enabled = true) =>
  useQuery({ ...todoQueries.pendingCounts(year), enabled });
export const useMyHistory = (query: MyHistoryQuery, enabled = true) =>
  useQuery({ ...todoQueries.history(query), enabled });
export const useAllHistory = (query: AllHistoryQuery, enabled = true) =>
  useQuery({ ...todoQueries.allHistory(query), enabled });
export const useMyTasks = (enabled = true) => useQuery({ ...todoQueries.myTasks(), enabled });

type TodoPage = Awaited<ReturnType<typeof listMyTodos>>;

/**
 * Answer a Todo. It leaves the list at once (contract §3); then every count, the calendar, history
 * and reports refresh (FE-DATA-003). Already answered elsewhere (409) or gone (404): it leaves too.
 */
export function useAnswerTodo() {
  const queryClient = useQueryClient();
  const removeFromLists = (todoId: string) =>
    queryClient.setQueriesData<TodoPage>({ queryKey: todoKeys.lists() }, (page) =>
      page && page.items.some((t) => t.id === todoId)
        ? { ...page, items: page.items.filter((t) => t.id !== todoId), total: page.total - 1 }
        : page,
    );
  return useMutation({
    mutationFn: (v: { id: string; body: TodoAnswer }) => answerTodo(browserApi, v.id, v.body),
    onSuccess: (_result, v) => {
      removeFromLists(v.id);
      return invalidateAllExceptSession(queryClient);
    },
    onError: (error, v) => {
      if (error instanceof ApiError && (error.status === 409 || error.status === 404)) {
        removeFromLists(v.id);
        void invalidateAllExceptSession(queryClient);
      }
    },
  });
}
