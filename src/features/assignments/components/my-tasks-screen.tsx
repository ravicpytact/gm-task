"use client";

import Link from "next/link";
import { useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
import { toUserMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { DataTable, type DataColumn } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { TableSkeleton } from "@/components/feedback/skeletons";
import { NoValue } from "@/components/layout/detail-page";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { typeLabel, useTaskTypes, type TaskTypeInfo } from "@/features/activities";
import { STATUS_FILTER_LABELS, STATUS_FILTERS, myTasksParsers } from "../constants";
import { useMyAssignments } from "../queries";
import type { AssignmentStatusFilter, MyAssignment } from "../types";
import {
  frequencyText,
  myTaskPath,
  nextDueLabel,
  todayIso,
  toMyAssignmentListQuery,
} from "../utils";
import { AssignmentStatusBadge, InactiveTag } from "./assignment-status-badge";

const EMPTY: Record<AssignmentStatusFilter, string> = {
  ACTIVE: "No active tasks.",
  ENDED: "No ended tasks.",
  ALL: "No tasks assigned to you yet.",
};

/**
 * Screen 30 — My tasks (contract §11): a User's own assignments, read-only. Cards on phones, a
 * table on wider screens; each opens My Task Detail.
 */
export function MyTasksScreen() {
  const [params, setParams] = useQueryStates(myTasksParsers);
  const [today] = useState(todayIso);
  const list = useMyAssignments(toMyAssignmentListQuery(params));
  const types = useTaskTypes().data?.items;

  const columns = useMemo<DataColumn<MyAssignment>[]>(
    () => [
      {
        id: "task",
        header: "Task",
        cell: (a) => (
          <span className="flex flex-wrap items-center gap-2">
            <Link href={myTaskPath(a.id)} className="font-medium hover:underline">
              {a.task.name}
            </Link>
            <InactiveTag status={a.task.status} />
          </span>
        ),
      },
      { id: "type", header: "Type", cell: (a) => typeLabel(a.task.type, types) },
      { id: "frequency", header: "Frequency", cell: (a) => frequencyText(a.frequency, a.weekdays) },
      {
        id: "next",
        header: "Next due",
        cell: (a) => nextDueLabel(a.next_due_dates, today) ?? <NoValue label="None" />,
      },
      { id: "since", header: "Since", cell: (a) => formatDate(a.start_date) },
      {
        id: "until",
        header: "Until",
        cell: (a) => (a.end_date ? formatDate(a.end_date) : "No end date"),
      },
      { id: "status", header: "Status", cell: (a) => <AssignmentStatusBadge assignment={a} /> },
    ],
    [types, today],
  );

  return (
    <>
      <PageHeader title="My tasks" />
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        value={params.status}
        onValueChange={(value) =>
          value && void setParams({ status: value as AssignmentStatusFilter, page: 1 })
        }
        aria-label="Show"
        className="mb-4 w-full sm:w-fit"
      >
        {STATUS_FILTERS.map((s) => (
          <ToggleGroupItem
            key={s}
            value={s}
            className="flex-1 px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground sm:flex-none"
          >
            {STATUS_FILTER_LABELS[s]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {list.isPending ? (
        <TableSkeleton rows={4} />
      ) : list.isError ? (
        <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
      ) : list.data.items.length === 0 ? (
        <EmptyState title={EMPTY[params.status]} />
      ) : (
        <>
          <DataTable
            caption="My tasks"
            rows={list.data.items}
            columns={columns}
            getRowId={(a) => a.id}
            refreshing={list.isFetching}
            renderCard={(a) => <MyTaskCard assignment={a} types={types} today={today} />}
          />
          <DataTablePagination
            page={list.data.page}
            pageSize={list.data.page_size}
            total={list.data.total}
            totalPages={list.data.total_pages}
            onPageChange={(page) => void setParams({ page })}
          />
        </>
      )}
    </>
  );
}

/** One of my tasks on a phone; the whole card opens it (the task name is the link). */
function MyTaskCard({
  assignment: a,
  types,
  today,
}: {
  assignment: MyAssignment;
  types: TaskTypeInfo[] | undefined;
  today: string;
}) {
  const next = nextDueLabel(a.next_due_dates, today);
  return (
    <Card size="sm" className="relative transition-colors has-[a:hover]:bg-muted/50">
      <CardContent className="flex flex-col gap-1">
        <p className="flex flex-wrap items-center gap-2">
          <Link
            href={myTaskPath(a.id)}
            className="font-medium after:absolute after:inset-0 after:rounded-xl"
          >
            {a.task.name}
          </Link>
          <span className="type-caption">{typeLabel(a.task.type, types)}</span>
          <InactiveTag status={a.task.status} />
        </p>
        <p className="text-sm">{frequencyText(a.frequency, a.weekdays)}</p>
        <p className="type-caption">
          {next ? `Next due ${next} · ` : ""}Since {formatDate(a.start_date)}
          {a.end_date ? ` · Until ${formatDate(a.end_date)}` : ""}
        </p>
        <div className="mt-1">
          <AssignmentStatusBadge assignment={a} />
        </div>
      </CardContent>
    </Card>
  );
}
