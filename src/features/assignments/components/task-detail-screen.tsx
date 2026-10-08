"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useCan } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { TaskDetail, type Task } from "@/features/activities";
import { PersonName } from "@/features/users";
import { ASSIGNMENT_PERMISSIONS } from "../constants";
import { AssignTaskDialog } from "./assign-task-dialog";
import { DetailTabs } from "./detail-tabs";

/**
 * Screen 29 — Task Detail (Admin; activities contract §6): the task from `activities`, with who
 * created and changed it (names from `users`), Assign with this task already chosen, and its
 * Assignments and History tabs.
 */
export function TaskDetailScreen({ taskId }: { taskId: string }) {
  const canAssign = useCan(ASSIGNMENT_PERMISSIONS.create);
  const [assigning, setAssigning] = useState<Task | null>(null);

  return (
    <>
      <TaskDetail
        taskId={taskId}
        personName={(userId) => <PersonName userId={userId} />}
        extraActions={(task) =>
          // Only active tasks can be assigned (contract §7).
          canAssign && task.status === "ACTIVE" ? (
            <Button onClick={() => setAssigning(task)}>
              <Plus aria-hidden /> Assign
            </Button>
          ) : null
        }
      >
        {(task) => (
          <DetailTabs
            scope={{ kind: "task", taskId: task.id }}
            emptyText="Nobody has this task yet."
          />
        )}
      </TaskDetail>
      {assigning ? (
        <AssignTaskDialog
          preset={{ task: { id: assigning.id, name: assigning.name } }}
          onClose={() => setAssigning(null)}
        />
      ) : null}
    </>
  );
}
