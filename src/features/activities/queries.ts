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
  createTask,
  deleteTask,
  getTask,
  getTaskDeletePreview,
  listTasks,
  listTaskTypes,
  updateTask,
} from "./api";
import type { TaskCreate, TaskListQuery, TaskUpdate } from "./types";

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (query: TaskListQuery) => [...taskKeys.lists(), query] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  deletePreview: (id: string) => [...taskKeys.all, "delete-preview", id] as const,
  types: () => [...taskKeys.all, "types"] as const,
};

export const taskQueries = {
  list: (query: TaskListQuery) =>
    queryOptions({
      queryKey: taskKeys.list(query),
      queryFn: () => listTasks(browserApi, query),
      placeholderData: keepPreviousData,
    }),
  /** One task with its version: read when a dialog opens, so a write sends a fresh ETag. */
  detail: (id: string) =>
    queryOptions({
      queryKey: taskKeys.detail(id),
      queryFn: () => getTask(browserApi, id),
      staleTime: 0,
    }),
  deletePreview: (id: string) =>
    queryOptions({
      queryKey: taskKeys.deletePreview(id),
      queryFn: () => getTaskDeletePreview(browserApi, id),
      staleTime: 0,
    }),
  /** The four answer types: fixed by the backend while the app runs. */
  types: () =>
    queryOptions({
      queryKey: taskKeys.types(),
      queryFn: () => listTaskTypes(browserApi),
      staleTime: Infinity,
    }),
};

export const useTaskList = (query: TaskListQuery) => useQuery(taskQueries.list(query));
export const useTaskTypes = () => useQuery(taskQueries.types());
export const useTask = (id: string | null) =>
  useQuery({ ...taskQueries.detail(id ?? ""), enabled: id !== null });
export const useTaskDeletePreview = (id: string | null) =>
  useQuery({ ...taskQueries.deletePreview(id ?? ""), enabled: id !== null });

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TaskCreate) => createTask(browserApi, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}

/**
 * Edit and activate / deactivate. A rename shows everywhere the task appears (assignments, history,
 * reports), and a status change alters what users get: refresh all server data (FE-DATA-003).
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; etag: string; body: TaskUpdate }) =>
      updateTask(browserApi, v.id, v.etag, v.body),
    onSuccess: (result, v) => {
      queryClient.setQueryData(taskKeys.detail(v.id), result);
      return invalidateAllExceptSession(queryClient);
    },
    onError: (error, v) => {
      if (error instanceof ApiError && error.status === 412) {
        void queryClient.invalidateQueries({ queryKey: taskKeys.detail(v.id) });
      }
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; etag: string }) => deleteTask(browserApi, v.id, v.etag),
    onSuccess: (_result, v) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(v.id) });
      queryClient.removeQueries({ queryKey: taskKeys.deletePreview(v.id) });
      // Its assignments and every Todo go too, and past reports change (ACT-R8).
      return invalidateAllExceptSession(queryClient);
    },
    onError: (error, v) => {
      if (error instanceof ApiError && error.status === 412) {
        void queryClient.invalidateQueries({ queryKey: taskKeys.detail(v.id) });
      }
    },
  });
}
