import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type NoticeTone = "info" | "success" | "error";

const TONES: Record<
  NoticeTone,
  { icon: typeof Info; className: string; role: "status" | "alert" }
> = {
  info: { icon: Info, className: "", role: "status" },
  success: {
    icon: CircleCheck,
    className: "border-success/30 bg-success/5 text-success-foreground",
    role: "status",
  },
  error: {
    icon: CircleAlert,
    className: "border-destructive/30 bg-destructive/5 text-destructive",
    role: "alert",
  },
};

/** A message about the whole form or screen. Icon and words, never colour alone (FE-UI-006). */
export function Notice({ tone, children }: { tone: NoticeTone; children: ReactNode }) {
  const { icon: Icon, className, role } = TONES[tone];
  return (
    <Alert role={role} className={className}>
      <Icon aria-hidden />
      <AlertDescription className="text-current">{children}</AlertDescription>
    </Alert>
  );
}
