import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import type { Assignment } from "../types";
import { frequencyText, personName } from "../utils";
import { AssignmentRowActions, type AssignmentAction } from "./assignment-row-actions";
import { AssignmentStatusBadge, CopiedTag, InactiveTag } from "./assignment-status-badge";

/** One assignment on a small screen: the table's columns as a card (FE-UI-005). */
export function AssignmentCard({
  assignment: a,
  onAction,
}: {
  assignment: Assignment;
  onAction: (action: AssignmentAction, assignment: Assignment) => void;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            <span className="truncate">{a.task.name}</span>
            <InactiveTag status={a.task.status} />
          </p>
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="truncate">{personName(a.user)}</span>
            <InactiveTag status={a.user.status} />
          </p>
          <p className="type-caption">
            {frequencyText(a.frequency, a.weekdays)} · {formatDate(a.start_date)} –{" "}
            {a.end_date ? formatDate(a.end_date) : "no end date"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <AssignmentStatusBadge assignment={a} />
            <CopiedTag copied={a.is_copied} />
          </div>
        </div>
        <AssignmentRowActions assignment={a} onAction={onAction} />
      </CardContent>
    </Card>
  );
}
