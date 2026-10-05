"use client";

import { CalendarX2, CalendarCog, MoreHorizontal, Repeat } from "lucide-react";
import { useCan } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ASSIGNMENT_PERMISSIONS } from "../constants";
import type { Assignment } from "../types";
import { canChangeEndDate, personName } from "../utils";

export type AssignmentAction = "frequency" | "end-date" | "deassign";

/** The row menu of the Assignment List (contract §6, Actions). */
export function AssignmentRowActions({
  assignment,
  onAction,
}: {
  assignment: Assignment;
  onAction: (action: AssignmentAction, assignment: Assignment) => void;
}) {
  const canUpdate = useCan(ASSIGNMENT_PERMISSIONS.update);
  const active = assignment.status === "ACTIVE";
  if (!canUpdate || (!active && !canChangeEndDate(assignment))) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${assignment.task.name} — ${personName(assignment.user)}`}
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {active ? (
          <DropdownMenuItem onSelect={() => onAction("frequency", assignment)}>
            <Repeat aria-hidden /> Change frequency
          </DropdownMenuItem>
        ) : null}
        {canChangeEndDate(assignment) ? (
          <DropdownMenuItem onSelect={() => onAction("end-date", assignment)}>
            <CalendarCog aria-hidden /> Change end date
          </DropdownMenuItem>
        ) : null}
        {active ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onAction("deassign", assignment)}
            >
              <CalendarX2 aria-hidden /> De-assign
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
