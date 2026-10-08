"use client";

import { useQueryStates } from "nuqs";
import { useState } from "react";
import { toUserMessage } from "@/lib/api";
import { useCan } from "@/lib/auth/client";
import { formatDate } from "@/lib/format";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { FilterSelect } from "@/components/data-table/filter-select";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { TableSkeleton } from "@/components/feedback/skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TaskPicker } from "@/features/activities";
import { UserPicker } from "@/features/users";
import { FREQUENCIES, FREQUENCY_LABELS, HISTORY_PERMISSIONS, historyParsers } from "../constants";
import { useAllHistory, useMyHistory, useMyTasks } from "../queries";
import type { Frequency } from "../types";
import { personName, toAllHistoryQuery, toHistoryQuery, todayIso, weekRange } from "../utils";
import { DateRangeInputs, HistoryTable } from "./history-table";

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

  const week = weekRange(today);
  const dateFrom = params.from ?? week.from;
  const dateTo = params.to ?? week.to;
  const filtered = Boolean(
    params.from || params.to || params.task || params.frequency || params.user,
  );
  const rows = history.data?.items;

  return (
    <>
      <PageHeader title={allUsers ? "History" : "My History"} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <DateRangeInputs
          from={dateFrom}
          to={dateTo}
          onFromChange={(from) => void setParams({ from, page: 1 })}
          onToChange={(to) => void setParams({ to, page: 1 })}
        />
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
          <HistoryTable
            items={history.data.items}
            caption={allUsers ? "Completed Todos" : "My completed Todos"}
            showUser={allUsers}
            showTask
            refreshing={history.isFetching}
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
