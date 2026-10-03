import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

/** Why a view is empty, and the next action when there is one (FE-UI-003). */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center">
      <Inbox className="size-8 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
