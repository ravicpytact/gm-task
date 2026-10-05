"use client";

import { cn } from "cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toUserMessage } from "@/lib/api";
import { formatDate, formatMonth, formatMonthShort } from "@/lib/format";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePendingCounts, useTodoCalendar } from "../queries";
import { calendarWeeks, monthOf, shiftMonth } from "../utils";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type View = "days" | "months" | "years";

const pendingText = (count: number) => (count ? `${count} pending` : "Nothing pending");

/**
 * The pending-dates calendar (contract §1, Screen 07). Days of one month by default; the title opens
 * the 12 months of its year, and the year opens the years, each with its pending count.
 *
 * Days: a past day with pending Todos is red (missed); its count shows on hover or focus. Today is
 * filled indigo, never red (its Todos can still be answered), and always shows its count; the
 * `selected` day is outlined in indigo and shows its count too. The same on every screen. `month` null is the server's month.
 */
export function PendingCalendar({
  month,
  onMonthChange,
  selected,
  onSelectDay,
}: {
  month: string | null;
  onMonthChange: (month: string) => void;
  selected?: string | undefined;
  onSelectDay: (day: string) => void;
}) {
  const calendar = useTodoCalendar(month);
  const [view, setView] = useState<View>("days");
  const [year, setYear] = useState<number | null>(null);
  const counts = usePendingCounts(year, view !== "days");

  if (calendar.isPending) {
    return <Skeleton className="h-96 w-full rounded-xl" aria-label="Loading the calendar" />;
  }
  if (calendar.isError) {
    return (
      <ErrorState message={toUserMessage(calendar.error)} onRetry={() => void calendar.refetch()} />
    );
  }

  const shown = calendar.data.month;
  const today = calendar.data.today;
  const shownYear = Number(shown.slice(0, 4));
  const viewYear = year ?? shownYear;

  const openMonths = (y: number) => {
    setYear(y);
    setView("months");
  };
  const openMonth = (m: string) => {
    onMonthChange(m);
    setView("days");
  };
  const toToday = () => openMonth(monthOf(today));

  const header =
    view === "days" ? (
      <Header
        title={formatMonth(shown)}
        titleLabel={`${formatMonth(shown)}: choose a month`}
        onTitle={() => openMonths(shownYear)}
        onPrevious={() => onMonthChange(shiftMonth(shown, -1))}
        onNext={() => onMonthChange(shiftMonth(shown, 1))}
        unit="month"
      />
    ) : view === "months" ? (
      <Header
        title={String(viewYear)}
        titleLabel={`${viewYear}: choose a year`}
        onTitle={() => setView("years")}
        onPrevious={() => setYear(viewYear - 1)}
        onNext={() => setYear(viewYear + 1)}
        unit="year"
      />
    ) : (
      <Header title="Years" />
    );

  return (
    <section aria-label="Pending-dates calendar">
      {header}
      {view === "days" ? (
        <DaysGrid
          month={shown}
          today={today}
          selected={selected}
          counts={new Map(calendar.data.days.map((d) => [d.date, d.pending_count]))}
          onSelectDay={onSelectDay}
          busy={calendar.isFetching}
        />
      ) : counts.isPending ? (
        <Skeleton className="h-48 w-full rounded-lg" aria-label="Loading the counts" />
      ) : counts.isError ? (
        <ErrorState message={toUserMessage(counts.error)} onRetry={() => void counts.refetch()} />
      ) : view === "months" ? (
        <CardGrid>
          {counts.data.months.map((m) => (
            <PeriodCard
              key={m.month}
              label={formatMonthShort(m.month)}
              fullLabel={formatMonth(m.month)}
              pending={m.pending}
              current={m.month === monthOf(today)}
              shown={m.month === shown}
              onClick={() => openMonth(m.month)}
            />
          ))}
        </CardGrid>
      ) : (
        <CardGrid>
          {counts.data.years.map((y) => (
            <PeriodCard
              key={y.year}
              label={String(y.year)}
              fullLabel={String(y.year)}
              pending={y.pending}
              current={y.year === Number(today.slice(0, 4))}
              shown={y.year === viewYear}
              onClick={() => openMonths(y.year)}
            />
          ))}
        </CardGrid>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {view === "days" ? (
          <ul className="flex flex-wrap gap-3 type-caption" aria-label="Legend">
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-destructive/15 ring-1 ring-destructive/40" />
              Missed
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-primary" />
              Today
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm ring-2 ring-primary" />
              Selected
            </li>
          </ul>
        ) : (
          <p className="type-caption">Red counts are Todos still pending.</p>
        )}
        {view !== "days" || shown !== monthOf(today) ? (
          <Button variant="ghost" size="sm" onClick={toToday}>
            Today
          </Button>
        ) : null}
      </div>
      {view === "days" ? (
        <p className="mt-2 type-caption">Choose a date to see its pending Todos.</p>
      ) : null}
    </section>
  );
}

function Header({
  title,
  titleLabel,
  onTitle,
  onPrevious,
  onNext,
  unit,
}: {
  title: string;
  titleLabel?: string;
  onTitle?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  unit?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      {onPrevious ? (
        <Button variant="ghost" size="icon-sm" onClick={onPrevious} aria-label={`Previous ${unit}`}>
          <ChevronLeft aria-hidden />
        </Button>
      ) : (
        <span className="size-8" />
      )}
      {onTitle ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onTitle}
          aria-label={titleLabel}
          className="font-semibold"
        >
          <span aria-live="polite">{title}</span>
        </Button>
      ) : (
        <h2 className="font-semibold">{title}</h2>
      )}
      {onNext ? (
        <Button variant="ghost" size="icon-sm" onClick={onNext} aria-label={`Next ${unit}`}>
          <ChevronRight aria-hidden />
        </Button>
      ) : (
        <span className="size-8" />
      )}
    </div>
  );
}

function DaysGrid({
  month,
  today,
  selected,
  counts,
  onSelectDay,
  busy,
}: {
  month: string;
  today: string;
  selected: string | undefined;
  counts: Map<string, number>;
  onSelectDay: (day: string) => void;
  busy: boolean;
}) {
  return (
    <table className="w-full table-fixed border-collapse text-center" aria-busy={busy}>
      <caption className="sr-only">{formatMonth(month)}</caption>
      <thead>
        <tr>
          {WEEKDAY_HEADERS.map((d) => (
            <th key={d} scope="col" className="pb-1 type-caption font-medium">
              {d}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {calendarWeeks(month).map((week, i) => (
          <tr key={i}>
            {week.map((day, j) => (
              <td key={j} className="p-0.5">
                {day ? (
                  <Day
                    day={day}
                    count={counts.get(day) ?? 0}
                    isToday={day === today}
                    missed={day < today && (counts.get(day) ?? 0) > 0}
                    isSelected={day === selected}
                    onSelect={() => onSelectDay(day)}
                  />
                ) : null}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Day({
  day,
  count,
  isToday,
  missed,
  isSelected,
  onSelect,
}: {
  day: string;
  count: number;
  isToday: boolean;
  missed: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const label = `${formatDate(day)}${isToday ? ", today" : ""}, ${pendingText(count).toLowerCase()}`;
  // Today is filled; another chosen day is outlined. Both show their count (today always does).
  const outlined = isSelected && !isToday;
  const showCount = count > 0 && (isToday || isSelected);
  const link = (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-current={isSelected ? "date" : undefined}
      className={cn(
        "relative mx-auto flex size-9 items-center justify-center rounded-lg text-sm tabular-nums transition-colors",
        "hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        missed && "bg-destructive/10 font-semibold text-destructive hover:bg-destructive/15",
        outlined && "font-bold text-primary ring-2 ring-primary ring-inset",
        isToday && "bg-primary font-bold text-primary-foreground hover:bg-primary/90",
      )}
    >
      {Number(day.slice(8))}
      {showCount ? (
        // Today's count, and the chosen day's, in the top-right corner.
        <span
          aria-hidden
          className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-xs leading-none font-semibold text-primary-foreground ring-2 ring-card"
        >
          {count}
        </span>
      ) : null}
    </button>
  );
  if (count === 0) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent>
        {pendingText(count)} · {formatDate(day)}
      </TooltipContent>
    </Tooltip>
  );
}

function CardGrid({ children }: { children: ReactNode }) {
  return <ul className="grid grid-cols-3 gap-2">{children}</ul>;
}

function PeriodCard({
  label,
  fullLabel,
  pending,
  current,
  shown,
  onClick,
}: {
  label: string;
  fullLabel: string;
  pending: number;
  current: boolean;
  shown: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-label={`${fullLabel}${current ? " (current)" : ""}, ${pendingText(pending).toLowerCase()}`}
        aria-current={shown ? "true" : undefined}
        className={cn(
          "flex w-full flex-col items-center gap-0.5 rounded-lg border px-2 py-2.5 transition-colors",
          "hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          shown && "border-primary bg-primary/5",
          current && "ring-2 ring-primary ring-inset",
        )}
      >
        <span className={cn("text-sm font-medium", current && "font-bold text-primary")}>
          {label}
        </span>
        <span
          className={cn(
            "text-xs tabular-nums",
            pending ? "font-semibold text-destructive" : "text-muted-foreground",
          )}
        >
          {pending ? `${pending} pending` : "—"}
        </span>
      </button>
    </li>
  );
}
