import { StatusBadge } from "@/components/feedback/status-badge";
import { Badge } from "@/components/ui/badge";
import type { Assignment } from "../types";
import { statusText } from "../utils";

/** Active / Ended (de-assigned) / Ended (end date passed). */
export function AssignmentStatusBadge({
  assignment,
}: {
  assignment: Pick<Assignment, "status" | "ended_reason">;
}) {
  const tone = assignment.status === "ACTIVE" ? "active" : "inactive";
  return <StatusBadge tone={tone} label={statusText(assignment)} />;
}

/** "Inactive" next to a person or task that can't get new Todos (contract §6). */
export function InactiveTag({ status }: { status: string }) {
  if (status === "ACTIVE") return null;
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Inactive
    </Badge>
  );
}

/** "Copied": made by Copy assignments (contract §6). */
export function CopiedTag({ copied }: { copied: boolean }) {
  if (!copied) return null;
  return <Badge variant="secondary">Copied</Badge>;
}
