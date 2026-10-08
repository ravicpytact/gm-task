"use client";

import { useState } from "react";
import { toUserMessage } from "@/lib/api";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { confirmationMatches, DeleteImpact } from "@/components/feedback/delete-impact";
import { toast } from "@/components/feedback/toast";
import { TASK_MESSAGES } from "../constants";
import { useDeleteTask, useTask, useTaskDeletePreview } from "../queries";
import type { Task } from "../types";

/** Screen 18 — Delete Task: the impact first (ACT-R9), then type the name to enable Delete. */
export function DeleteTaskDialog({
  task,
  onClose,
  onDeleted,
}: {
  task: Task;
  onClose: () => void;
  /** After a successful delete, before the dialog closes (Task Detail leaves the page). */
  onDeleted?: (() => void) | undefined;
}) {
  const current = useTask(task.id);
  const preview = useTaskDeletePreview(task.id);
  const remove = useDeleteTask();
  const [typed, setTyped] = useState("");

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Delete ${task.name}?`}
      description="Deleting a task removes it for every user."
      confirmLabel="Delete"
      confirmDisabled={
        !current.data ||
        !current.isFetchedAfterMount ||
        !preview.data ||
        !confirmationMatches(typed, task.name)
      }
      errorMessages={TASK_MESSAGES}
      onConfirm={async () => {
        if (!current.data) return;
        await remove.mutateAsync({ id: task.id, etag: current.data.etag });
        toast.success("Task deleted successfully");
        onDeleted?.();
      }}
    >
      <DeleteImpact
        counts={
          preview.data
            ? [
                { value: preview.data.users_affected, label: "users assigned" },
                { value: preview.data.todos_total, label: "Todos will be deleted" },
                {
                  value: preview.data.todos_completed,
                  label: "completed answers (history) will be lost",
                },
              ]
            : null
        }
        error={preview.isError ? toUserMessage(preview.error) : undefined}
        warning={`This permanently deletes ${task.name}, all its assignments and all its history for every user. Past reports will change. This cannot be undone.`}
        confirmText={task.name}
        typed={typed}
        onTypedChange={setTyped}
      />
    </ConfirmDialog>
  );
}
