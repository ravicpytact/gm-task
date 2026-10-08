"use client";

import { useQueryStates } from "nuqs";
import { useSession } from "@/lib/auth/client";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { FrequencyKpis, TodoList, todoListParsers, useTodoSummary } from "@/features/assignments";
import { DatePickerButton } from "./date-picker-button";
import { WelcomeTour } from "@/features/onboarding";

/**
 * Screens 05 and 27 — the home screen for everyone: one date drives the counts per frequency and the
 * pending Todos below. The date pill opens the pending-dates calendar (Screen 07) as a popup, so the
 * list keeps the full width. "Today" is the server's (contract §1).
 */
export function TodosScreen() {
  const [params, setParams] = useQueryStates(todoListParsers);
  const summary = useTodoSummary(params.date);
  const firstName = useSession().data?.user.first_name;

  const date = summary.data?.date;
  const today = summary.data?.today;
  const isToday = date !== undefined && date === today;
  const dateText = date ? `${isToday ? "Today · " : ""}${formatDate(date)}` : "…";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="type-page-title">{firstName ? `Hi, ${firstName}` : "Todos"}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DatePickerButton
            label={dateText}
            date={date}
            // Today is the default: no date in the URL.
            onSelectDay={(day) => void setParams({ date: day === today ? null : day, page: 1 })}
          />
          {/* Beside the pill on its outer side, so the pill (and its popup) never moves: right of it
              on phones, where the pill is on the left; left of it on wider screens. */}
          {date && !isToday ? (
            <Button
              variant="ghost"
              size="sm"
              className="sm:order-first"
              onClick={() => void setParams({ date: null, page: 1 })}
            >
              Back to today
            </Button>
          ) : null}
        </div>
      </div>

      <FrequencyKpis
        summary={summary.data}
        selected={params.frequency}
        onSelect={(frequency) => void setParams({ frequency, page: 1 })}
      />

      <TodoList date={date} />
      <WelcomeTour />
    </div>
  );
}
