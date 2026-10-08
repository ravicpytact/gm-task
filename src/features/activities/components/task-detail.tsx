"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { isNotFound, toUserMessage } from "@/lib/api";
import { useCan } from "@/lib/auth/client";
import { formatDateTime } from "@/lib/format";
import { ErrorState } from "@/components/feedback/error-state";
import { NotFoundState } from "@/components/feedback/not-found-state";
import { PageSkeleton } from "@/components/feedback/skeletons";
import { CountTiles, DetailHeader, FactList, NoValue } from "@/components/layout/detail-page";
import { Button } from "@/components/ui/button";
import { TASK_PERMISSIONS } from "../constants";
import { useTask, useTaskDeletePreview, useTaskTypes } from "../queries";
import type { Task } from "../types";
import { typeLabel } from "../utils";
import { useTaskActions } from "./task-actions";
import { TaskRowActions } from "./task-row-actions";
import { TaskStatusBadge } from "./task-status-badge";

const TASKS = { label: "Tasks", href: "/tasks" };

/**
 * Screen 29 — Task Detail (contract §6): the task, its counts and its actions. Who created or
 * changed it, and the Assign action and tabs, come from the composing screen in `assignments`
 * (they need `users` and `assignments`, which this feature does not know).
 */
export function TaskDetail({
  taskId,
  personName,
  extraActions,
  children,
}: {
  taskId: string;
  /** Renders a person's name from their id ("Created by"). */
  personName: (userId: string | null) => ReactNode;
  /** More header actions for this task (Assign). */
  extraActions?: (task: Task) => ReactNode;
  /** The rest of the page, once the task is known. */
  children: (task: Task) => ReactNode;
}) {
  const router = useRouter();
  const current = useTask(taskId);
  const types = useTaskTypes().data?.items;
  const [leaving, setLeaving] = useState(false);
  const { onAction, dialogs } = useTaskActions({
    onDeleted: () => {
      setLeaving(true); // the task is gone: show nothing of it while the list opens
      router.push(TASKS.href);
    },
  });
  const canUpdate = useCan(TASK_PERMISSIONS.update);
  const canDelete = useCan(TASK_PERMISSIONS.delete);
  // The counts come from the delete preview, which needs the delete permission.
  const preview = useTaskDeletePreview(canDelete && !leaving ? taskId : null);

  if (leaving || current.isPending) return <PageSkeleton />;
  if (current.isError) {
    return isNotFound(current.error, "task_id") ? (
      <NotFoundState message="This task doesn't exist or was deleted." back={TASKS} />
    ) : (
      <ErrorState message={toUserMessage(current.error)} onRetry={() => void current.refetch()} />
    );
  }

  const task = current.data.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <DetailHeader
          parent={TASKS}
          title={task.name}
          badges={<TaskStatusBadge status={task.status} />}
          actions={
            <>
              {canUpdate ? (
                <Button variant="outline" onClick={() => onAction("edit", task)}>
                  <Pencil aria-hidden /> Edit
                </Button>
              ) : null}
              {extraActions?.(task)}
              <TaskRowActions task={task} onAction={onAction} exclude={["edit"]} />
            </>
          }
        />
        <FactList
          facts={[
            { label: "Type", value: typeLabel(task.type, types) },
            {
              label: "Description",
              value: task.description ?? <NoValue label="No description" />,
            },
            { label: "Created on", value: formatDateTime(task.created_at) },
            { label: "Created by", value: personName(task.created_by) },
            { label: "Last changed", value: formatDateTime(task.updated_at) },
            { label: "Last changed by", value: personName(task.updated_by) },
          ]}
        />
      </div>

      {canDelete ? (
        preview.isError ? (
          <ErrorState
            message={toUserMessage(preview.error)}
            onRetry={() => void preview.refetch()}
          />
        ) : (
          <CountTiles
            counts={
              preview.data
                ? [
                    { label: "Users assigned", value: preview.data.users_affected },
                    { label: "Assignments", value: preview.data.assignments },
                    { label: "Todos", value: preview.data.todos_total },
                    { label: "Completed Todos", value: preview.data.todos_completed },
                  ]
                : null
            }
          />
        )
      ) : null}

      {children(task)}
      {dialogs}
    </div>
  );
}
