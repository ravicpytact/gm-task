"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RANGE_LABELS, RANGE_TYPES } from "../constants";
import type { RangeType, ReportRange } from "../types";
import { includesToday, rangeHeader, stepRange, type ReportParams } from "../utils";

const STEP_UNIT: Record<RangeType, string> = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  CUSTOM: "range",
};

/**
 * The report's range (contract §1): Today / Week / Month / Range, previous and next, and the header
 * line ("Week: 28 Sep – 04 Oct 2026"). `range` is what the server resolved (null while loading).
 */
export function RangePicker({
  params,
  range,
  problem,
  onChange,
}: {
  params: ReportParams;
  range: ReportRange | null;
  problem: string | null;
  onChange: (next: Partial<ReportParams>) => void;
}) {
  const fromId = useId();
  const toId = useId();
  const custom = params.range === "CUSTOM";
  // Back to the current day/week/month: clear the chosen one.
  const toCurrent = () => onChange({ day: null, week: null, month: null, page: 1 });

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        value={params.range}
        onValueChange={(value) => value && onChange({ range: value as RangeType, page: 1 })}
        aria-label="Range"
        className="w-full sm:w-fit"
      >
        {RANGE_TYPES.map((r) => (
          <ToggleGroupItem
            key={r}
            value={r}
            className="flex-1 px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground sm:flex-none"
          >
            {RANGE_LABELS[r]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {custom ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fromId}>From</Label>
            <Input
              id={fromId}
              type="date"
              value={params.from ?? ""}
              max={params.to ?? undefined}
              onChange={(e) => onChange({ from: e.target.value || null, page: 1 })}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={toId}>To</Label>
            <Input
              id={toId}
              type="date"
              value={params.to ?? ""}
              min={params.from ?? undefined}
              onChange={(e) => onChange({ to: e.target.value || null, page: 1 })}
              className="w-40"
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {!custom ? (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Previous ${STEP_UNIT[params.range]}`}
            disabled={!range}
            onClick={() => range && onChange({ ...stepRange(range, -1), page: 1 })}
          >
            <ChevronLeft aria-hidden />
          </Button>
        ) : null}
        <p className="min-w-48 text-center font-semibold sm:text-left" aria-live="polite">
          {problem ?? (range ? rangeHeader(range) : "…")}
        </p>
        {!custom ? (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Next ${STEP_UNIT[params.range]}`}
            disabled={!range}
            onClick={() => range && onChange({ ...stepRange(range, 1), page: 1 })}
          >
            <ChevronRight aria-hidden />
          </Button>
        ) : null}
        {!custom && range && !includesToday(range) ? (
          <Button variant="ghost" size="sm" onClick={toCurrent}>
            {params.range === "DAY"
              ? "Today"
              : params.range === "WEEK"
                ? "This week"
                : "This month"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
