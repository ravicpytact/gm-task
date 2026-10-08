"use client";

import { useCallback, useState } from "react";
import type { Task } from "../types";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { TaskFormDialog } from "./task-form-dialog";
import type { TaskAction } from "./task-row-actions";
import { TaskStatusDialog } from "./task-status-dialog";

type OpenDialog =
  | { kind: "edit"; task: Task }
  | { kind: "status"; task: Task; target: "ACTIVE" | "INACTIVE" }
  | { kind: "delete"; task: Task }
  | null;

/**
 * The actions on one task (contract §1, Actions), shared by the Task List and Task Detail:
 * `onAction` opens one, and `dialogs` renders it. `onDeleted` runs after a delete succeeds
 * (Task Detail goes back to the list).
 */
export function useTaskActions({ onDeleted }: { onDeleted?: () => void } = {}) {
  const [dialog, setDialog] = useState<OpenDialog>(null);

  const onAction = useCallback((action: TaskAction, task: Task) => {
    if (action === "edit") setDialog({ kind: "edit", task });
    else if (action === "deactivate") setDialog({ kind: "status", task, target: "INACTIVE" });
    else if (action === "activate") setDialog({ kind: "status", task, target: "ACTIVE" });
    else setDialog({ kind: "delete", task });
  }, []);

  const close = () => setDialog(null);
  const dialogs = (
    <>
      {dialog?.kind === "edit" ? <TaskFormDialog taskId={dialog.task.id} onClose={close} /> : null}
      {dialog?.kind === "status" ? (
        <TaskStatusDialog task={dialog.task} target={dialog.target} onClose={close} />
      ) : null}
      {dialog?.kind === "delete" ? (
        <DeleteTaskDialog task={dialog.task} onClose={close} onDeleted={onDeleted} />
      ) : null}
    </>
  );

  return { onAction, dialogs };
}
