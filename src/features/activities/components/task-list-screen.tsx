"use client";

import { Plus } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { toUserMessage } from "@/lib/api";
import { Can } from "@/lib/auth/client";
import { formatDateTime } from "@/lib/format";
import { DataTable, type DataColumn } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { FilterSelect } from "@/components/data-table/filter-select";
import { SearchInput } from "@/components/data-table/search-input";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { TableSkeleton } from "@/components/feedback/skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  STATUS_LABELS,
  TASK_PERMISSIONS,
  TASK_STATUSES,
  TASK_TYPES,
  taskListParsers,
} from "../constants";
import { useTaskList, useTaskTypes } from "../queries";
import type { Task, TaskStatus, TaskType } from "../types";
import { toTaskListQuery, typeLabel } from "../utils";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { TaskCard } from "./task-card";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskRowActions, type TaskAction } from "./task-row-actions";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskStatusDialog } from "./task-status-dialog";

type OpenDialog =
  | { kind: "create" }
  | { kind: "edit"; task: Task }
  | { kind: "status"; task: Task; target: "ACTIVE" | "INACTIVE" }
  | { kind: "delete"; task: Task }
  | null;

/** Screen 16 — Task List (Admin). On screen the word is always "Task". */
export function TaskListScreen() {
  const [params, setParams] = useQueryStates(taskListParsers);
  const list = useTaskList(toTaskListQuery(params));
  const types = useTaskTypes().data?.items;
  const [dialog, setDialog] = useState<OpenDialog>(null);

  const filtered = Boolean(params.search || params.type || params.status);
  const clearFilters = () => void setParams({ search: "", type: null, status: null, page: 1 });

  const onAction = useCallback((action: TaskAction, task: Task) => {
    if (action === "edit") setDialog({ kind: "edit", task });
    else if (action === "deactivate") setDialog({ kind: "status", task, target: "INACTIVE" });
    else if (action === "activate") setDialog({ kind: "status", task, target: "ACTIVE" });
    else setDialog({ kind: "delete", task });
  }, []);

  const columns = useMemo<DataColumn<Task>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        sortKey: "name",
        cell: (t) => <span className="font-medium">{t.name}</span>,
      },
      {
        id: "description",
        header: "Description",
        className: "max-w-xs",
        cell: (t) =>
          t.description ? (
            <span className="block truncate" title={t.description}>
              {t.description}
            </span>
          ) : (
            <span className="text-muted-foreground" aria-label="No description">
              —
            </span>
          ),
      },
      { id: "type", header: "Type", cell: (t) => typeLabel(t.type, types) },
      { id: "status", header: "Status", cell: (t) => <TaskStatusBadge status={t.status} /> },
      {
        id: "updated",
        header: "Updated",
        sortKey: "updated_at",
        cell: (t) => <span className="whitespace-nowrap">{formatDateTime(t.updated_at)}</span>,
      },
      {
        id: "actions",
        header: "Actions",
        hideHeader: true,
        className: "w-12 text-right",
        cell: (t) => <TaskRowActions task={t} onAction={onAction} />,
      },
    ],
    [types, onAction],
  );

  return (
    <>
      <PageHeader
        title="Tasks"
        actions={
          <Can code={TASK_PERMISSIONS.create}>
            <Button onClick={() => setDialog({ kind: "create" })}>
              <Plus aria-hidden /> Create task
            </Button>
          </Can>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={params.search}
          onSearch={(search) => void setParams({ search, page: 1 })}
          label="Search tasks"
          placeholder="Search tasks"
        />
        <FilterSelect
          label="Type"
          value={params.type}
          options={TASK_TYPES.map((t) => ({ value: t, label: typeLabel(t, types) }))}
          onChange={(type) => void setParams({ type: type as TaskType | null, page: 1 })}
        />
        <FilterSelect
          label="Status"
          value={params.status}
          options={TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          onChange={(status) => void setParams({ status: status as TaskStatus | null, page: 1 })}
        />
      </div>

      {list.isPending ? (
        <TableSkeleton rows={8} />
      ) : list.isError ? (
        <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
      ) : list.data.items.length === 0 ? (
        filtered ? (
          <EmptyState
            title="No tasks match your search."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No tasks yet. Create your first task."
            action={
              <Can code={TASK_PERMISSIONS.create}>
                <Button onClick={() => setDialog({ kind: "create" })}>
                  <Plus aria-hidden /> Create task
                </Button>
              </Can>
            }
          />
        )
      ) : (
        <>
          <DataTable
            caption="Tasks"
            rows={list.data.items}
            columns={columns}
            getRowId={(t) => t.id}
            renderCard={(t) => (
              <TaskCard task={t} typeLabel={typeLabel(t.type, types)} onAction={onAction} />
            )}
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

      {dialog?.kind === "create" ? (
        <TaskFormDialog taskId={null} onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.kind === "edit" ? (
        <TaskFormDialog taskId={dialog.task.id} onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.kind === "status" ? (
        <TaskStatusDialog
          task={dialog.task}
          target={dialog.target}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.kind === "delete" ? (
        <DeleteTaskDialog task={dialog.task} onClose={() => setDialog(null)} />
      ) : null}
    </>
  );
}
