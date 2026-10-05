import { StatusBadge } from "@/components/feedback/status-badge";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "../constants";

export function TaskStatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") return <StatusBadge tone="active" label={STATUS_LABELS.ACTIVE} />;
  if (status === "INACTIVE") return <StatusBadge tone="inactive" label={STATUS_LABELS.INACTIVE} />;
  return <Badge variant="outline">{status}</Badge>;
}
