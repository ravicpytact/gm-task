import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "../constants";
import type { UserStatus } from "../types";

const TONES: Record<UserStatus, StatusTone> = {
  ACTIVE: "active",
  INVITED: "pending",
  INACTIVE: "inactive",
};

export function UserStatusBadge({ status }: { status: string }) {
  if (!(status in TONES)) return <Badge variant="outline">{status}</Badge>;
  const known = status as UserStatus;
  return <StatusBadge tone={TONES[known]} label={STATUS_LABELS[known]} />;
}
