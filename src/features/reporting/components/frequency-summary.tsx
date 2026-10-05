import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";
import { FREQUENCIES, FREQUENCY_LABELS } from "@/features/assignments";
import type { FrequencyCounts } from "../types";
import { CountsLine, ReportStatus } from "./frequency-counts";

const byFrequency = (rows: FrequencyCounts[]) => new Map(rows.map((r) => [r.frequency, r]));

/**
 * Overall Frequency Summary (contract §2): one card per frequency with Completed / Total and the
 * pending count, or "No Task" when there is nothing.
 */
export function FrequencySummary({ summary }: { summary: FrequencyCounts[] }) {
  const counts = byFrequency(summary);
  return (
    <ul
      aria-label="Overall frequency summary"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7"
    >
      {FREQUENCIES.map((f) => {
        const c = counts.get(f);
        const none = !c || c.total === 0;
        return (
          <li key={f}>
            <Card size="sm" className="h-full">
              <CardContent className="flex flex-col gap-1">
                <span className="type-label">{FREQUENCY_LABELS[f]}</span>
                {none ? (
                  <span className="text-lg font-semibold text-neutral-status">No Task</span>
                ) : (
                  <>
                    <span className="text-lg font-semibold tabular-nums">
                      {c.completed} <span className="text-muted-foreground">/ {c.total}</span>
                    </span>
                    <span
                      className={cn(
                        "text-sm tabular-nums",
                        c.pending ? "font-medium text-destructive" : "text-success-foreground",
                      )}
                    >
                      {c.pending ? `${c.pending} pending` : "All done"}
                    </span>
                  </>
                )}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

/** My Report (Screen 09): one card per frequency with T · C · N · P and the status. */
export function FrequencyCards({ frequencies }: { frequencies: FrequencyCounts[] }) {
  const counts = byFrequency(frequencies);
  return (
    <ul aria-label="My report by frequency" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {FREQUENCIES.map((f) => {
        const c = counts.get(f);
        return (
          <li key={f}>
            <Card size="sm" className="h-full">
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{FREQUENCY_LABELS[f]}</span>
                  <ReportStatus status={c && c.total > 0 ? c.status : "NO_TASK"} />
                </div>
                {c && c.total > 0 ? (
                  <CountsLine counts={c} />
                ) : (
                  <span className="text-sm text-neutral-status">T 0 · C 0 · N 0 · P 0</span>
                )}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
