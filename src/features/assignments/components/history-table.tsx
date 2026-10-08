"use client";

import { useId, useMemo } from "react";
import { formatDate, formatDateTime } from "@/lib/format";
import { DataTable, type DataColumn } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTaskTypes, type TaskTypeInfo } from "@/features/activities";
import { FREQUENCY_LABELS } from "../constants";
import type { Frequency, HistoryItem } from "../types";
import { answerText, personName } from "../utils";

const frequencyLabel = (f: string) => FREQUENCY_LABELS[f as Frequency] ?? f;

const answerFor = (item: HistoryItem, types: TaskTypeInfo[] | undefined) =>
  answerText(
    item,
    types?.find((t) => t.type === item.task.type),
  );

/**
 * Completed Todos (contract §4–5): Date, User, Task, Frequency, Answer, Completed. History, the
 * detail pages and My Task Detail show it; a page about one person or one task leaves that column
 * out. Render it only with rows (the caller owns the view states).
 */
export function HistoryTable({
  items,
  caption,
  showUser,
  showTask,
  refreshing,
}: {
  items: HistoryItem[];
  caption: string;
  showUser: boolean;
  showTask: boolean;
  refreshing: boolean;
}) {
  const types = useTaskTypes().data?.items;

  const columns = useMemo<DataColumn<HistoryItem>[]>(
    () =>
      [
        {
          id: "date",
          header: "Date",
          cell: (i: HistoryItem) => (
            <span className="whitespace-nowrap">{formatDate(i.due_date)}</span>
          ),
        },
        showUser
          ? {
              id: "user",
              header: "User",
              cell: (i: HistoryItem) => (i.user ? personName(i.user) : ""),
            }
          : null,
        showTask
          ? {
              id: "task",
              header: "Task",
              cell: (i: HistoryItem) => <span className="font-medium">{i.task.name}</span>,
            }
          : null,
        {
          id: "frequency",
          header: "Frequency",
          cell: (i: HistoryItem) => frequencyLabel(i.frequency),
        },
        { id: "answer", header: "Answer", cell: (i: HistoryItem) => answerFor(i, types) },
        {
          id: "completed",
          header: "Completed",
          cell: (i: HistoryItem) => (
            <span className="whitespace-nowrap">{formatDateTime(i.completed_at)}</span>
          ),
        },
      ].filter((c) => c !== null),
    [types, showUser, showTask],
  );

  return (
    <DataTable
      caption={caption}
      rows={items}
      columns={columns}
      getRowId={(i) => i.todo_id}
      refreshing={refreshing}
      renderCard={(i) => (
        <Card size="sm">
          <CardContent className="flex flex-col gap-1">
            <p className="type-caption">
              {formatDate(i.due_date)}
              {showUser && i.user ? ` · ${personName(i.user)}` : ""}
            </p>
            <p className="flex flex-wrap items-center gap-2 font-medium">
              {showTask ? i.task.name : null}
              <Badge variant="secondary">{frequencyLabel(i.frequency)}</Badge>
            </p>
            <p className="text-sm">
              Answer: <strong>{answerFor(i, types)}</strong>
            </p>
            <p className="type-caption">Completed {formatDateTime(i.completed_at)}</p>
          </CardContent>
        </Card>
      )}
    />
  );
}

/** From / To calendar days of a history view; clearing one goes back to the current week's. */
export function DateRangeInputs({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (day: string | null) => void;
  onToChange: (day: string | null) => void;
}) {
  const fromId = useId();
  const toId = useId();
  return (
    <div className="flex gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={fromId}>From</Label>
        <Input
          id={fromId}
          type="date"
          value={from}
          max={to}
          onChange={(e) => onFromChange(e.target.value || null)}
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={toId}>To</Label>
        <Input
          id={toId}
          type="date"
          value={to}
          min={from}
          onChange={(e) => onToChange(e.target.value || null)}
          className="w-40"
        />
      </div>
    </div>
  );
}
