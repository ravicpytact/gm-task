"use client";

import { CalendarClock } from "lucide-react";
import { useMemo } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FREQUENCIES, FREQUENCY_LABELS, WEEKDAY_LABELS, WEEKDAYS } from "../constants";
import { useDueDates } from "../queries";
import type { DueDatesQuery, Frequency, Weekday } from "../types";
import { nextDueText, sortWeekdays } from "../utils";

type ControlProps = {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export function FrequencySelect({
  value,
  onChange,
  ...aria
}: ControlProps & { value: Frequency | undefined; onChange: (value: Frequency) => void }) {
  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v as Frequency)}>
      <SelectTrigger className="w-full sm:w-56" {...aria}>
        <SelectValue placeholder="Choose a frequency" />
      </SelectTrigger>
      <SelectContent>
        {FREQUENCIES.map((f) => (
          <SelectItem key={f} value={f}>
            {FREQUENCY_LABELS[f]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** The days of a Weekly schedule: Mon–Sun as toggle buttons, any number of them. */
export function WeekdayToggle({
  value,
  onChange,
  id,
  ...aria
}: ControlProps & { value: Weekday[]; onChange: (value: Weekday[]) => void }) {
  return (
    <ToggleGroup
      id={id}
      type="multiple"
      variant="outline"
      spacing={1}
      value={value}
      onValueChange={(days) => onChange(sortWeekdays(days as Weekday[]))}
      className="flex-wrap"
      {...aria}
    >
      {WEEKDAYS.map((d) => (
        <ToggleGroupItem
          key={d}
          value={d}
          className="min-w-11 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {WEEKDAY_LABELS[d]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

const PREVIEW_COUNT = 3;
const PREVIEW_DEBOUNCE_MS = 300;

/**
 * "Next: Thu 01 Oct, Mon 05 Oct, Thu 08 Oct" under a schedule (contract §7). The dates come from
 * the server, so they follow the real rules; nothing is asked until the schedule is complete.
 */
export function DueDatesPreview({
  frequency,
  weekdays,
  startDate,
  endDate,
  today,
}: {
  frequency: Frequency | undefined;
  weekdays: Weekday[];
  startDate: string;
  endDate?: string | undefined;
  today: string;
}) {
  const days = frequency === "WEEKLY" ? sortWeekdays(weekdays).join(",") : "";
  const complete =
    frequency !== undefined &&
    (frequency !== "WEEKLY" || days !== "") &&
    startDate >= today &&
    (!endDate || endDate >= startDate);
  // Built from plain values, so it changes only when the schedule does (the debounce compares it).
  const query = useMemo<DueDatesQuery | null>(
    () =>
      complete && frequency
        ? {
            frequency,
            weekdays: days || undefined,
            start_date: startDate,
            end_date: endDate || undefined,
            count: PREVIEW_COUNT,
          }
        : null,
    [complete, frequency, days, startDate, endDate],
  );
  const debounced = useDebouncedValue(query, PREVIEW_DEBOUNCE_MS);
  const dates = useDueDates(debounced);

  const text = !complete
    ? null
    : dates.isError
      ? "Couldn't load the next dates."
      : dates.data
        ? nextDueText(dates.data.due_dates)
        : "Working out the next dates…";

  return (
    <p className="flex min-h-5 items-center gap-2 type-caption" aria-live="polite">
      {text ? (
        <>
          <CalendarClock className="size-3.5 shrink-0" aria-hidden />
          {text}
        </>
      ) : null}
    </p>
  );
}
