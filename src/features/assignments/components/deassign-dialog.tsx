"use client";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { toast } from "@/components/feedback/toast";
import { ASSIGNMENT_MESSAGES } from "../constants";
import { useAssignment, useUpdateAssignment } from "../queries";
import type { Assignment } from "../types";
import { personName } from "../utils";

/** Screen 23 — De-assign (contract §9). Reads the assignment first: the change sends its version. */
export function DeassignDialog({
  assignment,
  onClose,
}: {
  assignment: Assignment;
  onClose: () => void;
}) {
  const current = useAssignment(assignment.id);
  const update = useUpdateAssignment();
  const task = assignment.task.name;

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Stop ${task} for ${personName(assignment.user)}?`}
      description="Today's Todo and past pending Todos stay and can still be answered. No new Todos from tomorrow. History and reports are kept."
      confirmLabel="De-assign"
      variant="destructive"
      confirmDisabled={!current.data || !current.isFetchedAfterMount}
      errorMessages={ASSIGNMENT_MESSAGES}
      onConfirm={async () => {
        if (!current.data) return;
        await update.mutateAsync({
          id: assignment.id,
          etag: current.data.etag,
          body: { status: "ENDED" },
        });
        toast.success("Assignment ended");
      }}
    />
  );
}
