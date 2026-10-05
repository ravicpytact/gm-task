import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import type { Task } from "../types";
import { TaskRowActions, type TaskAction } from "./task-row-actions";
import { TaskStatusBadge } from "./task-status-badge";

/** One task on a small screen: the table's columns as a card (FE-UI-005). */
export function TaskCard({
  task,
  typeLabel,
  onAction,
}: {
  task: Task;
  typeLabel: string;
  onAction: (action: TaskAction, task: Task) => void;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate font-medium">{task.name}</p>
          {task.description ? <p className="truncate type-caption">{task.description}</p> : null}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <span className="type-caption">
              {typeLabel} · Updated {formatDate(task.updated_at)}
            </span>
          </div>
        </div>
        <TaskRowActions task={task} onAction={onAction} />
      </CardContent>
    </Card>
  );
}
