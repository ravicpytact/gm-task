"use client";

import { Copy, Plus } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { toUserMessage } from "@/lib/api";
import { Can } from "@/lib/auth/client";
import { formatDate } from "@/lib/format";
import { DataTable, type DataColumn } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { FilterSelect } from "@/components/data-table/filter-select";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { TableSkeleton } from "@/components/feedback/skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  ASSIGNMENT_PERMISSIONS,
  FREQUENCIES,
  FREQUENCY_LABELS,
  STATUS_FILTER_LABELS,
  STATUS_FILTERS,
  assignmentListParsers,
} from "../constants";
import { useAssignmentList } from "../queries";
import type { Assignment, AssignmentStatusFilter, Frequency } from "../types";
import { frequencyText, personName, toAssignmentListQuery } from "../utils";
import { AssignTaskDialog } from "./assign-task-dialog";
import { AssignmentCard } from "./assignment-card";
import { AssignmentRowActions, type AssignmentAction } from "./assignment-row-actions";
import { AssignmentStatusBadge, CopiedTag, InactiveTag } from "./assignment-status-badge";
import { ChangeEndDateDialog } from "./change-end-date-dialog";
import { ChangeFrequencyDialog } from "./change-frequency-dialog";
import { CopyAssignmentsDialog } from "./copy-assignments-dialog";
import { DeassignDialog } from "./deassign-dialog";
import { TaskPicker } from "@/features/activities";
import { UserPicker } from "@/features/users";

type OpenDialog =
  { kind: "assign" } | { kind: "copy" } | { kind: AssignmentAction; assignment: Assignment } | null;

/** Screen 19 — Assignment List (Admin). Menu: "Task Assignments". */
export function AssignmentListScreen() {
  const [params, setParams] = useQueryStates(assignmentListParsers);
  const list = useAssignmentList(toAssignmentListQuery(params));
  const [dialog, setDialog] = useState<OpenDialog>(null);

  const filtered = Boolean(
    params.user || params.task || params.frequency || params.status !== "ACTIVE",
  );
  const clearFilters = () =>
    void setParams({ user: null, task: null, frequency: null, status: null, page: 1 });

  // The rows name the filtered person and task, so the pickers can show them after a reload.
  const rows = list.data?.items;
  const userLabels = useMemo(
    () => Object.fromEntries((rows ?? []).map((a) => [a.user.id, personName(a.user)])),
    [rows],
  );
  const taskLabels = useMemo(
    () => Object.fromEntries((rows ?? []).map((a) => [a.task.id, a.task.name])),
    [rows],
  );

  const onAction = useCallback(
    (kind: AssignmentAction, assignment: Assignment) => setDialog({ kind, assignment }),
    [],
  );

  const columns = useMemo<DataColumn<Assignment>[]>(
    () => [
      {
        id: "user",
        header: "User",
        sortKey: "user_name",
        cell: (a) => (
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{personName(a.user)}</span>
            <InactiveTag status={a.user.status} />
          </span>
        ),
      },
      {
        id: "task",
        header: "Task",
        sortKey: "task_name",
        cell: (a) => (
          <span className="flex flex-wrap items-center gap-2">
            {a.task.name}
            <InactiveTag status={a.task.status} />
          </span>
        ),
      },
      { id: "frequency", header: "Frequency", cell: (a) => frequencyText(a.frequency, a.weekdays) },
      {
        id: "start",
        header: "Start date",
        sortKey: "start_date",
        cell: (a) => <span className="whitespace-nowrap">{formatDate(a.start_date)}</span>,
      },
      {
        id: "end",
        header: "End date",
        cell: (a) =>
          a.end_date ? (
            <span className="whitespace-nowrap">{formatDate(a.end_date)}</span>
          ) : (
            <span className="text-muted-foreground" aria-label="No end date">
              —
            </span>
          ),
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
        id: "actions",
        header: "Actions",
        hideHeader: true,
        className: "w-12 text-right",
        cell: (a) => <AssignmentRowActions assignment={a} onAction={onAction} />,
      },
    ],
    [onAction],
  );

  const headerActions = (
    <>
      <Can code={ASSIGNMENT_PERMISSIONS.copy}>
        <Button variant="outline" onClick={() => setDialog({ kind: "copy" })}>
          <Copy aria-hidden /> Copy assignments
        </Button>
      </Can>
      <Can code={ASSIGNMENT_PERMISSIONS.create}>
        <Button onClick={() => setDialog({ kind: "assign" })}>
          <Plus aria-hidden /> Assign task
        </Button>
      </Can>
    </>
  );

  return (
    <>
      <PageHeader title="Task Assignments" actions={headerActions} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="w-full sm:w-56">
          <UserPicker
            aria-label="User"
            placeholder="User: All"
            value={params.user}
            onChange={(user) => void setParams({ user, page: 1 })}
            clearable
            knownLabels={userLabels}
          />
        </div>
        <div className="w-full sm:w-56">
          <TaskPicker
            aria-label="Task"
            placeholder="Task: All"
            value={params.task}
            onChange={(task) => void setParams({ task, page: 1 })}
            clearable
            knownLabels={taskLabels}
          />
        </div>
        <FilterSelect
          label="Frequency"
          value={params.frequency}
          options={FREQUENCIES.map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }))}
          onChange={(frequency) =>
            void setParams({ frequency: frequency as Frequency | null, page: 1 })
          }
        />
        <FilterSelect
          label="Status"
          value={params.status}
          includeAll={false}
          options={STATUS_FILTERS.map((s) => ({ value: s, label: STATUS_FILTER_LABELS[s] }))}
          onChange={(status) =>
            void setParams({ status: status as AssignmentStatusFilter | null, page: 1 })
          }
        />
      </div>

      {list.isPending ? (
        <TableSkeleton rows={8} />
      ) : list.isError ? (
        <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
      ) : list.data.items.length === 0 ? (
        filtered ? (
          <EmptyState
            title="No assignments match these filters."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No tasks assigned yet. Assign a task to get started."
            action={
              <Can code={ASSIGNMENT_PERMISSIONS.create}>
                <Button onClick={() => setDialog({ kind: "assign" })}>
                  <Plus aria-hidden /> Assign task
                </Button>
              </Can>
            }
          />
        )
      ) : (
        <>
          <DataTable
            caption="Task assignments"
            rows={list.data.items}
            columns={columns}
            getRowId={(a) => a.id}
            renderCard={(a) => <AssignmentCard assignment={a} onAction={onAction} />}
            refreshing={list.isFetching}
            sort={{
              by: params.sort,
              order: params.order,
              onSortChange: (sort, order) =>
                void setParams({ sort: sort as typeof params.sort, order, page: 1 }),
            }}
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

      {dialog?.kind === "assign" ? <AssignTaskDialog onClose={() => setDialog(null)} /> : null}
      {dialog?.kind === "copy" ? <CopyAssignmentsDialog onClose={() => setDialog(null)} /> : null}
      {dialog?.kind === "frequency" ? (
        <ChangeFrequencyDialog
          assignmentId={dialog.assignment.id}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.kind === "end-date" ? (
        <ChangeEndDateDialog assignmentId={dialog.assignment.id} onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.kind === "deassign" ? (
        <DeassignDialog assignment={dialog.assignment} onClose={() => setDialog(null)} />
      ) : null}
    </>
  );
}
