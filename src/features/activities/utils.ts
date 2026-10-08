import type { inferParserType } from "nuqs/server";
import { TASKS_PAGE_SIZE, TYPE_LABELS, taskListParsers } from "./constants";
import type { TaskListQuery, TaskType, TaskTypeInfo } from "./types";

export type TaskListParams = inferParserType<typeof taskListParsers>;

/** The backend query a Task List URL asks for (a plain literal: see nextjs-api-client). */
export function toTaskListQuery(params: TaskListParams): TaskListQuery {
  return {
    page: params.page,
    page_size: TASKS_PAGE_SIZE,
    sort_by: params.sort,
    sort_order: params.order,
    search: params.search || undefined,
    type: params.type ?? undefined,
    status: params.status ?? undefined,
  };
}

export function typeLabel(type: string, types: TaskTypeInfo[] | undefined): string {
  return types?.find((t) => t.type === type)?.label ?? TYPE_LABELS[type as TaskType] ?? type;
}

/** "Users will answer: 1, 2, 3, 4, No, Other (5 or more)" (Screen 17). */
export function answerPreview(info: TaskTypeInfo): string {
  if (info.accepts_time) return "Any time, e.g. 06:30";
  const options = info.options.map((o) => o.label);
  if (info.has_other) options.push(`Other (${info.other_min ?? 5} or more)`);
  return options.join(", ");
}

/** Task Detail (contract §6). */
export const taskPath = (taskId: string) => `/tasks/${taskId}`;
