"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toUserMessage } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import { DataTable, type DataColumn } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { FilterSelect } from "@/components/data-table/filter-select";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { TableSkeleton } from "@/components/feedback/skeletons";
import { NoValue } from "@/components/layout/detail-page";
import { Button } from "@/components/ui/button";
import { taskPath } from "@/features/activities";
import { PersonName, userPath } from "@/features/users";
import { FREQUENCIES, FREQUENCY_LABELS, STATUS_FILTER_LABELS, STATUS_FILTERS } from "../constants";
import { useAssignmentList } from "../queries";
import type { Assignment, AssignmentStatusFilter, Frequency } from "../types";
import {
  frequencyText,
  nextDueLabel,
  personName,
  todayIso,
  toDetailAssignmentQuery,
  type DetailChanges,
  type DetailParams,
  type DetailScope,
} from "../utils";
import { useAssignmentActions } from "./assignment-actions";
import { AssignmentCard } from "./assignment-card";
import { AssignmentRowActions } from "./assignment-row-actions";
import { AssignmentStatusBadge, CopiedTag, InactiveTag } from "./assignment-status-badge";

const nowrap = (text: string) => <span className="whitespace-nowrap">{text}</span>;

/**
 * The Assignments tab of User Detail and Task Detail: the Assignment List's columns for this person
 * or task (without that column), plus Next due, Assigned on and Assigned by; the same row actions.
 */
export function DetailAssignmentsTab({
  scope,
  emptyText,
  params,
  setParams,
}: {
  scope: DetailScope;
  /** No assignments at all: "No tasks assigned to Ravi yet." / "Nobody has this task yet." */
  emptyText: string;
  params: DetailParams;
  setParams: (changes: DetailChanges) => void;
}) {
  const [today] = useState(todayIso);
  const list = useAssignmentList(toDetailAssignmentQuery(params, scope));
  const { onAction, dialogs } = useAssignmentActions();
  const forUser = scope.kind === "user";

  const columns = useMemo<DataColumn<Assignment>[]>(
    () => [
      forUser
        ? {
            id: "task",
            header: "Task",
            cell: (a) => (
              <span className="flex flex-wrap items-center gap-2">
                <Link href={taskPath(a.task.id)} className="font-medium hover:underline">
                  {a.task.name}
                </Link>
                <InactiveTag status={a.task.status} />
              </span>
            ),
          }
        : {
            id: "user",
            header: "User",
            cell: (a) => (
              <span className="flex flex-wrap items-center gap-2">
                <Link href={userPath(a.user.id)} className="font-medium hover:underline">
                  {personName(a.user)}
                </Link>
                <InactiveTag status={a.user.status} />
              </span>
            ),
          },
      { id: "frequency", header: "Frequency", cell: (a) => frequencyText(a.frequency, a.weekdays) },
      { id: "start", header: "Start date", cell: (a) => nowrap(formatDate(a.start_date)) },
      {
        id: "end",
        header: "End date",
        cell: (a) =>
          a.end_date ? nowrap(formatDate(a.end_date)) : <NoValue label="No end date" />,
      },
      {
        id: "status",
        header: "Status",
        cell: (a) => (
          <span className="flex flex-wrap items-center gap-2">
            <AssignmentStatusBadge assignment={a} />
            <CopiedTag copied={a.is_copied} />
          </span>
        ),
      },
      {
        id: "next",
        header: "Next due",
        cell: (a) => {
          const next = nextDueLabel(a.next_due_dates, today);
          return next ? nowrap(next) : <NoValue label="None" />;
        },
      },
      {
        id: "assigned-on",
        header: "Assigned on",
        cell: (a) => nowrap(formatDateTime(a.created_at)),
      },
      {
        id: "assigned-by",
        header: "Assigned by",
        cell: (a) => <PersonName userId={a.created_by} />,
      },
      {
        id: "actions",
        header: "Actions",
        hideHeader: true,
        className: "w-12 text-right",
        cell: (a) => <AssignmentRowActions assignment={a} onAction={onAction} />,
      },
    ],
    [forUser, today, onAction],
  );

  const empty =
    params.frequency !== null ? (
      <EmptyState
        title="No assignments match these filters."
        action={
          <Button
            variant="outline"
            onClick={() => setParams({ frequency: null, status: null, page: 1 })}
          >
            Clear filters
          </Button>
        }
      />
    ) : params.status === "ACTIVE" ? (
      // Active is the default view; there may still be ended ones.
      <EmptyState
        title="No active assignments."
        action={
          <Button variant="outline" onClick={() => setParams({ status: "ALL", page: 1 })}>
            Show all
          </Button>
        }
      />
    ) : (
      <EmptyState title={params.status === "ALL" ? emptyText : "No ended assignments."} />
    );

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <FilterSelect
          label="Status"
          value={params.status}
          includeAll={false}
          options={STATUS_FILTERS.map((s) => ({ value: s, label: STATUS_FILTER_LABELS[s] }))}
          onChange={(status) =>
            setParams({ status: status as AssignmentStatusFilter | null, page: 1 })
          }
        />
        <FilterSelect
          label="Frequency"
          value={params.frequency}
          options={FREQUENCIES.map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }))}
          onChange={(frequency) => setParams({ frequency: frequency as Frequency | null, page: 1 })}
        />
      </div>

      {list.isPending ? (
        <TableSkeleton rows={4} />
      ) : list.isError ? (
        <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
      ) : list.data.items.length === 0 ? (
        empty
      ) : (
        <>
          <DataTable
            caption="Assignments"
            rows={list.data.items}
            columns={columns}
            getRowId={(a) => a.id}
            refreshing={list.isFetching}
            renderCard={(a) => {
              const next = nextDueLabel(a.next_due_dates, today);
              return (
                <AssignmentCard
                  assignment={a}
                  onAction={onAction}
                  without={forUser ? "user" : "task"}
                  extra={
                    <p className="type-caption">
                      {next ? `Next due ${next} · ` : ""}Assigned {formatDate(a.created_at)} by{" "}
                      <PersonName userId={a.created_by} />
                    </p>
                  }
                />
              );
            }}
          />
          <DataTablePagination
            page={list.data.page}
            pageSize={list.data.page_size}
            total={list.data.total}
            totalPages={list.data.total_pages}
            onPageChange={(page) => setParams({ page })}
          />
        </>
      )}
      {dialogs}
    </>
  );
}
