"use client";

import { useQueryStates } from "nuqs";
import { useState } from "react";
import { isNotFound, toUserMessage } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { NotFoundState } from "@/components/feedback/not-found-state";
import { PageSkeleton, TableSkeleton } from "@/components/feedback/skeletons";
import { DetailHeader, FactList, NoValue } from "@/components/layout/detail-page";
import { Button } from "@/components/ui/button";
import { typeLabel, useTaskTypes } from "@/features/activities";
import { myTaskHistoryParsers } from "../constants";
import { useMyAssignment, useMyHistory } from "../queries";
import type { MyAssignment } from "../types";
import {
  endedText,
  frequencyText,
  personName,
  todayIso,
  toMyTaskHistoryQuery,
  weekRange,
} from "../utils";
import { AssignmentStatusBadge } from "./assignment-status-badge";
import { DateRangeInputs, HistoryTable } from "./history-table";

const MY_TASKS = { label: "My tasks", href: "/my-tasks" };

/** Screen 31 — My Task Detail (contract §12): one of my tasks, read-only, and my answers to it. */
export function MyTaskDetailScreen({ assignmentId }: { assignmentId: string }) {
  const [today] = useState(todayIso);
  const current = useMyAssignment(assignmentId);
  const types = useTaskTypes().data?.items;

  if (current.isPending) return <PageSkeleton />;
  if (current.isError) {
    return isNotFound(current.error, "assignment_id") ? (
      <NotFoundState message="This task isn't assigned to you." back={MY_TASKS} />
    ) : (
      <ErrorState message={toUserMessage(current.error)} onRetry={() => void current.refetch()} />
    );
  }

  const a = current.data;
  const person = (p: MyAssignment["assigned_by"]) =>
    p ? personName(p) : <NoValue label="Unknown" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <DetailHeader
          parent={MY_TASKS}
          title={a.task.name}
          badges={<AssignmentStatusBadge assignment={a} />}
        />
        <FactList
          facts={[
            { label: "Type", value: typeLabel(a.task.type, types) },
            {
              label: "Description",
              value: a.task.description ?? <NoValue label="No description" />,
            },
            { label: "Frequency", value: frequencyText(a.frequency, a.weekdays) },
            {
              label: "Next due",
              value: a.next_due_dates.length ? (
                a.next_due_dates.map((d) => (d === today ? "Today" : formatDate(d))).join(" · ")
              ) : (
                <NoValue label="None" />
              ),
            },
            { label: "Since", value: formatDate(a.start_date) },
            { label: "Until", value: a.end_date ? formatDate(a.end_date) : "No end date" },
            { label: "Status", value: endedText(a) },
            { label: "Assigned on", value: formatDateTime(a.created_at) },
            { label: "Assigned by", value: person(a.assigned_by) },
            { label: "Last changed", value: formatDateTime(a.updated_at) },
            { label: "Last changed by", value: person(a.last_changed_by) },
          ]}
        />
      </div>
      <MyTaskHistory taskId={a.task.id} today={today} />
    </div>
  );
}

/** My answers to this task, from every assignment of it I have had (contract §12). */
function MyTaskHistory({ taskId, today }: { taskId: string; today: string }) {
  const [params, setParams] = useQueryStates(myTaskHistoryParsers);
  const history = useMyHistory(toMyTaskHistoryQuery(params, taskId, today));
  const week = weekRange(today);
  const filtered = Boolean(params.from || params.to);

  return (
    <section aria-labelledby="my-history" className="flex flex-col gap-4">
      <h2 id="my-history" className="type-section-title">
        My history
      </h2>
      <DateRangeInputs
        from={params.from ?? week.from}
        to={params.to ?? week.to}
        onFromChange={(from) => void setParams({ from, page: 1 })}
        onToChange={(to) => void setParams({ to, page: 1 })}
      />
      {history.isPending ? (
        <TableSkeleton rows={3} />
      ) : history.isError ? (
        <ErrorState message={toUserMessage(history.error)} onRetry={() => void history.refetch()} />
      ) : history.data.items.length === 0 ? (
        <EmptyState
          title="No answers in this period."
          action={
            filtered ? (
              <Button
                variant="outline"
                onClick={() => void setParams({ from: null, to: null, page: 1 })}
              >
                Back to this week
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div>
          <HistoryTable
            items={history.data.items}
            caption="My answers to this task"
            showUser={false}
            showTask={false}
            refreshing={history.isFetching}
          />
          <DataTablePagination
            page={history.data.page}
            pageSize={history.data.page_size}
            total={history.data.total}
            totalPages={history.data.total_pages}
            onPageChange={(page) => void setParams({ page })}
          />
        </div>
      )}
    </section>
  );
}
