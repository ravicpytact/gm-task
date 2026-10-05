import type { Operations, Schemas } from "@/lib/api";

// On screen the word is always "Task"; `activities` is only the code name (Glossary → Code names).

export type Task = Schemas["TaskRead"];
export type TaskCreate = Schemas["TaskCreate"];
export type TaskUpdate = Schemas["TaskUpdate"];
export type TaskTypeInfo = Schemas["TaskTypeRead"];
export type TaskDeletePreview = Schemas["TaskDeletePreviewRead"];

export type TaskListQuery = NonNullable<
  Operations["list_tasks_v1_tasks_get"]["parameters"]["query"]
>;
export type TaskType = TaskCreate["type"];
export type TaskStatus = NonNullable<TaskListQuery["status"]>;
export type TaskSortField = NonNullable<TaskListQuery["sort_by"]>;
