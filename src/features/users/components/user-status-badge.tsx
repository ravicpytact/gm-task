import { CircleCheck, CircleSlash, MailQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "../constants";
import type { UserStatus } from "../types";

// Active green, Invited amber, Inactive grey (style guide). Icon and word, never colour alone.
const STYLES: Record<UserStatus, { icon: typeof CircleCheck; className: string }> = {
  ACTIVE: {
    icon: CircleCheck,
    className: "border-success/30 bg-success/10 text-success-foreground",
  },
  INVITED: {
    icon: MailQuestion,
    className: "border-warning/30 bg-warning/10 text-warning-foreground",
  },
  INACTIVE: { icon: CircleSlash, className: "border-border bg-muted text-muted-foreground" },
};

export function UserStatusBadge({ status }: { status: string }) {
  const known = status in STYLES ? (status as UserStatus) : null;
  if (!known) return <Badge variant="outline">{status}</Badge>;
  const { icon: Icon, className } = STYLES[known];
  return (
    <Badge variant="outline" className={className}>
      <Icon aria-hidden />
      {STATUS_LABELS[known]}
    </Badge>
  );
}
