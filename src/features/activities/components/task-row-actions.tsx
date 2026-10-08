"use client";

import { MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { useCan } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TASK_PERMISSIONS } from "../constants";
import type { Task } from "../types";

export type TaskAction = "edit" | "deactivate" | "activate" | "delete";

/** The row menu of the Task List (docs/04-design/activities/ui_data_contract.md §1, Actions). */
export function TaskRowActions({
  task,
  onAction,
  exclude = [],
}: {
  task: Task;
  onAction: (action: TaskAction, task: Task) => void;
  /** Actions shown elsewhere on the screen (Task Detail has its own Edit button). */
  exclude?: TaskAction[];
}) {
  const canUpdate = useCan(TASK_PERMISSIONS.update);
  const canDelete = useCan(TASK_PERMISSIONS.delete);
  const showEdit = canUpdate && !exclude.includes("edit");
  if (!canUpdate && !canDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${task.name}`}>
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {canUpdate ? (
          <>
            {showEdit ? (
              <DropdownMenuItem onSelect={() => onAction("edit", task)}>
                <Pencil aria-hidden /> Edit
              </DropdownMenuItem>
            ) : null}
            {task.status === "ACTIVE" ? (
              <DropdownMenuItem onSelect={() => onAction("deactivate", task)}>
                <PowerOff aria-hidden /> Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onAction("activate", task)}>
                <Power aria-hidden /> Activate
              </DropdownMenuItem>
            )}
          </>
        ) : null}
        {canDelete ? (
          <>
            {canUpdate ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem variant="destructive" onSelect={() => onAction("delete", task)}>
              <Trash2 aria-hidden /> Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
