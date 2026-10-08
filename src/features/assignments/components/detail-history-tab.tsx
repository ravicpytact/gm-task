"use client";

import { useState } from "react";
import { toUserMessage } from "@/lib/api";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { FilterSelect } from "@/components/data-table/filter-select";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { TableSkeleton } from "@/components/feedback/skeletons";
import { Button } from "@/components/ui/button";
import { TaskPicker } from "@/features/activities";
import { UserPicker } from "@/features/users";
import { FREQUENCIES, FREQUENCY_LABELS } from "../constants";
import { useAllHistory } from "../queries";
import type { Frequency } from "../types";
import {
  personName,
  todayIso,
  toDetailHistoryQuery,
  weekRange,
  type DetailChanges,
  type DetailParams,
  type DetailScope,
} from "../utils";
import { DateRangeInputs, HistoryTable } from "./history-table";

/**
 * The History tab of User Detail and Task Detail: History (all users) for this person or task, by
 * date range (default this week), the other side (Task on User Detail, User on Task Detail) and
 * frequency.
 */
export function DetailHistoryTab({
  scope,
  params,
  setParams,
}: {
  scope: DetailScope;
  params: DetailParams;
  setParams: (changes: DetailChanges) => void;
}) {
  const [today] = useState(todayIso);
  const history = useAllHistory(toDetailHistoryQuery(params, scope, today));
  const forUser = scope.kind === "user";
  const week = weekRange(today);
  const rows = history.data?.items ?? [];
  const filtered = Boolean(
    params.from || params.to || params.frequency || (forUser ? params.task : params.user),
  );

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <DateRangeInputs
          from={params.from ?? week.from}
          to={params.to ?? week.to}
          onFromChange={(from) => setParams({ from, page: 1 })}
          onToChange={(to) => setParams({ to, page: 1 })}
        />
        <div className="w-full sm:w-56">
          {forUser ? (
            <TaskPicker
              aria-label="Task"
              placeholder="Task: All"
              clearable
              value={params.task}
              onChange={(task) => setParams({ task, page: 1 })}
              knownLabels={Object.fromEntries(rows.map((i) => [i.task.id, i.task.name]))}
            />
          ) : (
            <UserPicker
              aria-label="User"
              placeholder="User: All users"
              hideInvited
              clearable
              value={params.user}
              onChange={(user) => setParams({ user, page: 1 })}
              knownLabels={Object.fromEntries(
                rows.flatMap((i) => (i.user ? [[i.user.id, personName(i.user)]] : [])),
              )}
            />
          )}
        </div>
        <FilterSelect
          label="Frequency"
          value={params.frequency}
          options={FREQUENCIES.map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }))}
          onChange={(frequency) => setParams({ frequency: frequency as Frequency | null, page: 1 })}
        />
      </div>

      {history.isPending ? (
        <TableSkeleton rows={4} />
      ) : history.isError ? (
        <ErrorState message={toUserMessage(history.error)} onRetry={() => void history.refetch()} />
      ) : history.data.items.length === 0 ? (
        <EmptyState
          title="No answers in this period."
          action={
            filtered ? (
              <Button
                variant="outline"
                onClick={() =>
                  setParams({
                    from: null,
                    to: null,
                    frequency: null,
                    user: null,
                    task: null,
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
            caption="Answers"
            showUser={!forUser}
            showTask={forUser}
            refreshing={history.isFetching}
          />
          <DataTablePagination
            page={history.data.page}
            pageSize={history.data.page_size}
            total={history.data.total}
            totalPages={history.data.total_pages}
            onPageChange={(page) => setParams({ page })}
          />
        </>
      )}
    </>
  );
}
