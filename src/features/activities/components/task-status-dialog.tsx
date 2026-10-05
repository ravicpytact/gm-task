"use client";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { toast } from "@/components/feedback/toast";
import { TASK_MESSAGES } from "../constants";
import { useTask, useUpdateTask } from "../queries";
import type { Task } from "../types";

/** Activate / Deactivate (contract §4). Reads the task first: the change must send its version. */
export function TaskStatusDialog({
  task,
  target,
  onClose,
}: {
  task: Task;
  target: "ACTIVE" | "INACTIVE";
  onClose: () => void;
}) {
  const current = useTask(task.id);
  const update = useUpdateTask();
  const deactivate = target === "INACTIVE";
  const name = task.name;

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={deactivate ? `Deactivate ${name}?` : `Activate ${name}?`}
      description={
        deactivate
          ? `Users keep their pending ${name} Todos (including today's) and can still answer them. No new ${name} Todos from tomorrow.`
          : "Todos restart from today where due. Missed days are not filled in."
      }
      confirmLabel={deactivate ? "Deactivate" : "Activate"}
      variant={deactivate ? "destructive" : "default"}
      confirmDisabled={!current.data || !current.isFetchedAfterMount}
      errorMessages={TASK_MESSAGES}
      onConfirm={async () => {
        if (!current.data) return;
        await update.mutateAsync({
          id: task.id,
          etag: current.data.etag,
          body: { status: target },
        });
        toast.success(deactivate ? `${name} deactivated` : `${name} activated`);
      }}
    />
  );
}
