import { unwrap, unwrapEmpty, unwrapWithEtag, type ApiClient } from "@/lib/api";
import type { TaskCreate, TaskListQuery, TaskUpdate } from "./types";

export const listTaskTypes = (api: ApiClient) => unwrap(api.GET("/v1/task-types"));

export const listTasks = (api: ApiClient, query: TaskListQuery) =>
  unwrap(api.GET("/v1/tasks", { params: { query } }));

export const getTask = (api: ApiClient, taskId: string) =>
  unwrapWithEtag(api.GET("/v1/tasks/{task_id}", { params: { path: { task_id: taskId } } }));

export const createTask = (api: ApiClient, body: TaskCreate) =>
  unwrap(api.POST("/v1/tasks", { body }));

/** Edit name / description, or activate / deactivate. Sends the version it read (FE-API-005). */
export const updateTask = (api: ApiClient, taskId: string, etag: string, body: TaskUpdate) =>
  unwrapWithEtag(
    api.PATCH("/v1/tasks/{task_id}", {
      params: { path: { task_id: taskId }, header: { "If-Match": etag } },
      body,
    }),
  );

export const getTaskDeletePreview = (api: ApiClient, taskId: string) =>
  unwrap(api.GET("/v1/tasks/{task_id}/delete-preview", { params: { path: { task_id: taskId } } }));

export const deleteTask = (api: ApiClient, taskId: string, etag: string) =>
  unwrapEmpty(
    api.DELETE("/v1/tasks/{task_id}", {
      params: { path: { task_id: taskId }, header: { "If-Match": etag } },
    }),
  );
