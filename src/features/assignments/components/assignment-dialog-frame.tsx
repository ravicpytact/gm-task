"use client";

import type { ReactNode } from "react";
import { toUserMessage } from "@/lib/api";
import { ErrorState } from "@/components/feedback/error-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssignment } from "../queries";
import type { Assignment } from "../types";
import { personName } from "../utils";

/**
 * A dialog that changes one assignment. It reads the assignment first, so the change sends the
 * version it saw (If-Match), and names it: "Ravi Patel — Pull-ups" (contract §8, §8a).
 */
export function AssignmentDialogFrame({
  assignmentId,
  title,
  onClose,
  children,
}: {
  assignmentId: string;
  title: string;
  onClose: () => void;
  children: (assignment: Assignment, etag: string) => ReactNode;
}) {
  const current = useAssignment(assignmentId);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {current.data
              ? `${personName(current.data.data.user)} — ${current.data.data.task.name}`
              : "Loading the assignment…"}
          </DialogDescription>
        </DialogHeader>
        {current.isPending || !current.isFetchedAfterMount ? (
          <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : current.isError ? (
          <ErrorState
            message={toUserMessage(current.error)}
            onRetry={() => void current.refetch()}
          />
        ) : (
          children(current.data.data, current.data.etag)
        )}
      </DialogContent>
    </Dialog>
  );
}
