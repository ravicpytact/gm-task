import { LinkIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AuthCard } from "./auth-card";

/** A one-time email link that can no longer be used: say so, and what to do next. */
export function LinkProblem({ message, action }: { message: string; action: ReactNode }) {
  return (
    <AuthCard title="This link can't be used">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <LinkIcon className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm">{message}</p>
        {action}
      </div>
    </AuthCard>
  );
}
