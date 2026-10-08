"use client";

import { useCallback, useState } from "react";
import type { Assignment } from "../types";
import type { AssignmentAction } from "./assignment-row-actions";
import { ChangeEndDateDialog } from "./change-end-date-dialog";
import { ChangeFrequencyDialog } from "./change-frequency-dialog";
import { DeassignDialog } from "./deassign-dialog";

/**
 * The row actions on one assignment (contract §6): Change frequency, Change end date, De-assign.
 * Shared by the Assignment List and the Assignments tabs of User and Task Detail.
 */
export function useAssignmentActions() {
  const [open, setOpen] = useState<{ kind: AssignmentAction; assignment: Assignment } | null>(null);
  const onAction = useCallback(
    (kind: AssignmentAction, assignment: Assignment) => setOpen({ kind, assignment }),
    [],
  );

  const close = () => setOpen(null);
  const dialogs = (
    <>
      {open?.kind === "frequency" ? (
        <ChangeFrequencyDialog assignmentId={open.assignment.id} onClose={close} />
      ) : null}
      {open?.kind === "end-date" ? (
        <ChangeEndDateDialog assignmentId={open.assignment.id} onClose={close} />
      ) : null}
      {open?.kind === "deassign" ? (
        <DeassignDialog assignment={open.assignment} onClose={close} />
      ) : null}
    </>
  );

  return { onAction, dialogs };
}
