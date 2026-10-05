import { CircleCheck, CircleSlash, MailQuestion, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type StatusTone = "active" | "pending" | "inactive";

// Active green, pending/invited amber, inactive grey (style guide). Icon and word, never colour alone.
const TONES: Record<StatusTone, { icon: LucideIcon; className: string }> = {
  active: {
    icon: CircleCheck,
    className: "border-success/30 bg-success/10 text-success-foreground",
  },
  pending: {
    icon: MailQuestion,
    className: "border-warning/30 bg-warning/10 text-warning-foreground",
  },
  inactive: { icon: CircleSlash, className: "border-border bg-muted text-muted-foreground" },
};

/** A status as a badge (FE-UI-006). Features map their own statuses to a tone and a label. */
export function StatusBadge({ tone, label }: { tone: StatusTone; label: string }) {
  const { icon: Icon, className } = TONES[tone];
  return (
    <Badge variant="outline" className={className}>
      <Icon aria-hidden />
      {label}
    </Badge>
  );
}
