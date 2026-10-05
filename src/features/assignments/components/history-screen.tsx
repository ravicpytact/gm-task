"use client";

import { useQueryStates } from "nuqs";
import { useId, useMemo, useState } from "react";
import { toUserMessage } from "@/lib/api";
import { useCan } from "@/lib/auth/client";
import { formatDate, formatDateTime } from "@/lib/format";
import { DataTable, type DataColumn } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { FilterSelect } from "@/components/data-table/filter-select";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { TableSkeleton } from "@/components/feedback/skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TaskPicker, useTaskTypes, type TaskTypeInfo } from "@/features/activities";
import { UserPicker } from "@/features/users";
import { FREQUENCIES, FREQUENCY_LABELS, HISTORY_PERMISSIONS, historyParsers } from "../constants";
import { useAllHistory, useMyHistory, useMyTasks } from "../queries";
import type { Frequency, HistoryItem } from "../types";
import {
  answerText,
  personName,
  toAllHistoryQuery,
  toHistoryQuery,
  todayIso,
  weekRange,
} from "../utils";

const frequencyLabel = (f: string) => FREQUENCY_LABELS[f as Frequency] ?? f;

const answerFor = (item: HistoryItem, types: TaskTypeInfo[] | undefined) =>
  answerText(
    item,
    types?.find((t) => t.type === item.task.type),
  );

/**
 * History (contract §4–5): completed Todos, newest first. Admins (read_all) see Screen 25 — everyone,
 * with a User filter and column; everyone else sees Screen 08, My History.
 */
export function HistoryScreen() {
  const allUsers = useCan(HISTORY_PERMISSIONS.readAll);
  const [today] = useState(todayIso);
  const [params, setParams] = useQueryStates(historyParsers);
  const mine = useMyHistory(toHistoryQuery(params, today), !allUsers);
  const everyone = useAllHistory(toAllHistoryQuery(params, today), allUsers);
  const history = allUsers ? everyone : mine;
  const myTasks = useMyTasks(!allUsers).data?.items ?? [];
  const types = useTaskTypes().data?.items;
  const fromId = useId();
  const toId = useId();

  const week = weekRange(today);
  const dateFrom = params.from ?? week.from;
  const dateTo = params.to ?? week.to;
  const filtered = Boolean(
    params.from || params.to || params.task || params.frequency || params.user,
  );
  const rows = history.data?.items;

  const columns = useMemo<DataColumn<HistoryItem>[]>(
    () => [
      {
        id: "date",
        header: "Date",
        cell: (i) => <span className="whitespace-nowrap">{formatDate(i.due_date)}</span>,
      },
      ...(allUsers
        ? [
            {
              id: "user",
              header: "User",
              cell: (i: HistoryItem) => (i.user ? personName(i.user) : ""),
            },
          ]
        : []),
      {
        id: "task",
        header: "Task",
        cell: (i) => <span className="font-medium">{i.task.name}</span>,
      },
      { id: "frequency", header: "Frequency", cell: (i) => frequencyLabel(i.frequency) },
      { id: "answer", header: "Answer", cell: (i) => answerFor(i, types) },
      {
        id: "completed",
        header: "Completed",
        cell: (i) => <span className="whitespace-nowrap">{formatDateTime(i.completed_at)}</span>,
      },
    ],
    [types, allUsers],
  );

  return (
    <>
      <PageHeader title={allUsers ? "History" : "My History"} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fromId}>From</Label>
            <Input
              id={fromId}
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => void setParams({ from: e.target.value || null, page: 1 })}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={toId}>To</Label>
            <Input
              id={toId}
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => void setParams({ to: e.target.value || null, page: 1 })}
              className="w-40"
            />
          </div>
        </div>
        {allUsers ? (
          <>
            <div className="w-full sm:w-56">
              <UserPicker
                aria-label="User"
                placeholder="User: All users"
                hideInvited
                clearable
                value={params.user}
                onChange={(user) => void setParams({ user, page: 1 })}
                knownLabels={Object.fromEntries(
                  (rows ?? []).flatMap((i) => (i.user ? [[i.user.id, personName(i.user)]] : [])),
                )}
              />
            </div>
            <div className="w-full sm:w-56">
              <TaskPicker
                aria-label="Task"
                placeholder="Task: All"
                clearable
                value={params.task}
                onChange={(task) => void setParams({ task, page: 1 })}
                knownLabels={Object.fromEntries((rows ?? []).map((i) => [i.task.id, i.task.name]))}
              />
            </div>
          </>
        ) : (
          <FilterSelect
            label="Task"
            value={params.task}
            options={myTasks.map((t) => ({ value: t.id, label: t.name }))}
            onChange={(task) => void setParams({ task, page: 1 })}
          />
        )}
        <FilterSelect
          label="Frequency"
          value={params.frequency}
          options={FREQUENCIES.map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }))}
          onChange={(frequency) =>
            void setParams({ frequency: frequency as Frequency | null, page: 1 })
          }
        />
      </div>

      {history.isPending ? (
        <TableSkeleton rows={6} />
      ) : history.isError ? (
        <ErrorState message={toUserMessage(history.error)} onRetry={() => void history.refetch()} />
      ) : history.data.items.length === 0 ? (
        <EmptyState
          title={
            filtered
              ? "Nothing answered matches these filters."
              : `Nothing answered this week (${formatDate(week.from)} – ${formatDate(week.to)}).`
          }
          action={
            filtered ? (
              <Button
                variant="outline"
                onClick={() =>
                  void setParams({
                    from: null,
                    to: null,
                    task: null,
                    frequency: null,
                    user: null,
                    page: 1,
                  })
                }
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <DataTable
            caption={allUsers ? "Completed Todos" : "My completed Todos"}
            rows={history.data.items}
            columns={columns}
            getRowId={(i) => i.todo_id}
            refreshing={history.isFetching}
            renderCard={(i) => (
              <Card size="sm">
                <CardContent className="flex flex-col gap-1">
                  <p className="type-caption">
                    {formatDate(i.due_date)}
                    {i.user ? ` · ${personName(i.user)}` : ""}
                  </p>
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {i.task.name}
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
          <DataTablePagination
            page={history.data.page}
            pageSize={history.data.page_size}
            total={history.data.total}
            totalPages={history.data.total_pages}
            onPageChange={(page) => void setParams({ page })}
          />
        </>
      )}
    </>
  );
}
