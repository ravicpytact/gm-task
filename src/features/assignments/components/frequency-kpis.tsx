"use client";

import { cn } from "cn";
import { FREQUENCIES, FREQUENCY_LABELS } from "../constants";
import type { Frequency, TodoSummary } from "../types";

/**
 * One card per frequency with the pending count for the chosen day (contract §1). Pending in red,
 * zero in grey; choosing a card filters the Todo list, choosing it again clears the filter.
 * All seven are always in view: 4 + 3 on phones and tablets, one row of 7 on wide screens.
 */
export function FrequencyKpis({
  summary,
  selected,
  onSelect,
}: {
  summary: TodoSummary | undefined;
  selected: Frequency | null;
  onSelect: (frequency: Frequency | null) => void;
}) {
  const pendingOf = (f: Frequency) =>
    summary?.pending_by_frequency.find((p) => p.frequency === f)?.pending;

  return (
    <ul
      aria-label="Pending by frequency"
      className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-7"
    >
      {FREQUENCIES.map((f) => {
        const pending = pendingOf(f);
        const active = selected === f;
        return (
          <li key={f} className="min-w-0">
            <button
              type="button"
              aria-pressed={active}
              aria-label={`${FREQUENCY_LABELS[f]}: ${pending ?? "loading"} pending`}
              onClick={() => onSelect(active ? null : f)}
              className={cn(
                "flex h-full w-full flex-col justify-between gap-1 rounded-xl border bg-card p-2 text-left shadow-xs transition-colors sm:gap-2 sm:p-3",
                "hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                active && "border-primary bg-primary/5 ring-1 ring-primary",
              )}
            >
              <span className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                {FREQUENCY_LABELS[f]}
              </span>
              <span className="flex flex-wrap items-baseline gap-x-1">
                <span
                  className={cn(
                    "text-xl leading-none font-bold tabular-nums sm:type-kpi sm:leading-none",
                    pending ? "text-destructive" : "text-neutral-status",
                  )}
                >
                  {pending ?? "–"}
                </span>
                <span className="text-xs text-muted-foreground">pending</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
