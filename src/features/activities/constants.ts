import { parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";
import type { TaskSortField, TaskStatus, TaskType } from "./types";

/** Permission codes this feature checks (docs/04-design/acm). The backend enforces them. */
export const TASK_PERMISSIONS = {
  readAll: "activities.task.read_all",
  create: "activities.task.create",
  update: "activities.task.update",
  delete: "activities.task.delete",
} as const;

export const TASK_TYPES: TaskType[] = ["TIME", "YES_NO", "FOOD", "NUMBER"];
export const TASK_STATUSES: TaskStatus[] = ["ACTIVE", "INACTIVE"];
export const STATUS_LABELS: Record<TaskStatus, string> = { ACTIVE: "Active", INACTIVE: "Inactive" };

/** Shown until GET /v1/task-types answers; the backend's labels win once loaded. */
export const TYPE_LABELS: Record<TaskType, string> = {
  TIME: "Time",
  YES_NO: "Yes-No",
  FOOD: "Food",
  NUMBER: "Number",
};

export const TASKS_PAGE_SIZE = 20;
const SORT_FIELDS: TaskSortField[] = ["name", "updated_at"];

/** What the Task List shows lives in the URL (FE-DATA-004); shared by browser and prefetch. */
export const taskListParsers = {
  page: parseAsInteger.withDefault(1),
  search: parseAsString.withDefault(""),
  type: parseAsStringLiteral(TASK_TYPES),
  status: parseAsStringLiteral(TASK_STATUSES),
  sort: parseAsStringLiteral(SORT_FIELDS).withDefault("name"),
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc"),
};

export const NAME_MAX = 100;
export const DESCRIPTION_MAX = 500;

/** The contract's words (docs/04-design/activities/ui_data_contract.md). */
export const TASK_MESSAGES = {
  PRECONDITION_FAILED: "This task was changed by someone else. Refresh and try again.",
  DUPLICATE_TASK_NAME: "A task with this name already exists.",
};

/** How many items a searchable picker loads per search (the backend allows up to 100). */
export const PICKER_PAGE_SIZE = 50;
