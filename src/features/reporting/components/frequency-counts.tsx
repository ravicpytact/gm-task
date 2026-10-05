import { cn } from "cn";
import { CircleCheck, CircleDashed, CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_TEXT } from "../constants";
import type { FrequencyCounts } from "../types";

// Colours from the contract (§3): C green when > 0, P red when > 0, zeros grey; the status word
// Pending red, Complete green, No Task grey. Words and icons too, never colour alone (FE-UI-006).

const STATUS_STYLE: Record<string, { icon: typeof CircleCheck; className: string }> = {
  PENDING: {
    icon: CircleAlert,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  COMPLETE: {
    icon: CircleCheck,
    className: "border-success/30 bg-success/10 text-success-foreground",
  },
  NO_TASK: { icon: CircleDashed, className: "border-border bg-muted text-muted-foreground" },
};

export function ReportStatus({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.NO_TASK!;
  const Icon = style.icon;
  return (
    <Badge variant="outline" className={style.className}>
      <Icon aria-hidden />
      {STATUS_TEXT[status] ?? status}
    </Badge>
  );
}

function Count({
  letter,
  name,
  value,
  tone,
}: {
  letter: string;
  name: string;
  value: number;
  tone?: "success" | "danger";
}) {
  return (
    <span
      className={cn(
        "tabular-nums",
        value === 0
          ? "text-neutral-status"
          : tone === "success"
            ? "font-semibold text-success-foreground"
            : tone === "danger"
              ? "font-semibold text-destructive"
              : "text-foreground",
      )}
    >
      <abbr title={name} className="no-underline">
        {letter}
      </abbr>{" "}
      {value}
    </span>
  );
}

/** "T 6 · C 4 · N 1 · P 2" for one frequency; `grid` lays them out 2 × 2 (T C / N P) for table cells. */
export function CountsLine({ counts, grid = false }: { counts: FrequencyCounts; grid?: boolean }) {
  return (
    <span
      className={cn(
        "text-sm",
        grid ? "grid w-fit grid-cols-2 gap-x-3" : "flex flex-wrap items-center gap-x-2 gap-y-0.5",
      )}
    >
      <Count letter="T" name="Total" value={counts.total} />
      <Count letter="C" name="Completed (includes No)" value={counts.completed} tone="success" />
      <Count letter="N" name="Answered No" value={counts.no} />
      <Count letter="P" name="Pending" value={counts.pending} tone="danger" />
    </span>
  );
}

/** One frequency in the User Wise table: counts and status, or just "No Task". */
export function FrequencyCell({ counts }: { counts: FrequencyCounts | undefined }) {
  if (!counts || counts.total === 0) {
    return <span className="text-sm text-neutral-status">No Task</span>;
  }
  return (
    <span className="flex flex-col items-start gap-1">
      <CountsLine counts={counts} grid />
      <ReportStatus status={counts.status} />
    </span>
  );
}
