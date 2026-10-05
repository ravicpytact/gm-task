"use client";

import { useQueryStates } from "nuqs";
import { useMemo } from "react";
import { toUserMessage } from "@/lib/api";
import { useCan } from "@/lib/auth/client";
import { DataTable, type DataColumn } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { TableSkeleton } from "@/components/feedback/skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FREQUENCIES, FREQUENCY_LABELS } from "@/features/assignments";
import { UserPicker } from "@/features/users";
import { REPORT_LEGEND, REPORT_PERMISSIONS, reportParsers } from "../constants";
import { useMyReport, useReport } from "../queries";
import type { ReportUserRow } from "../types";
import { rangeProblem, toMyReportQuery, toReportQuery } from "../utils";
import { CountsLine, FrequencyCell, ReportStatus } from "./frequency-counts";
import { FrequencyCards, FrequencySummary } from "./frequency-summary";
import { RangePicker } from "./range-picker";

const personName = (u: { first_name: string; last_name: string }) =>
  `${u.first_name} ${u.last_name}`;

/**
 * The Report (contract: reporting). Admins (read_all) see Screen 26, all users by default with a
 * User filter; everyone else sees Screen 09, My Report.
 */
export function ReportScreen() {
  const allUsers = useCan(REPORT_PERMISSIONS.readAll);
  const [params, setParams] = useQueryStates(reportParsers);
  const problem = rangeProblem(params);
  const all = useReport(toReportQuery(params), allUsers && !problem);
  const mine = useMyReport(toMyReportQuery(params), !allUsers && !problem);
  const range = (allUsers ? all.data?.range : mine.data?.range) ?? null;

  return (
    <>
      <PageHeader title={allUsers ? "Reporting" : "My Report"} />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <RangePicker
          params={params}
          range={range}
          problem={problem}
          onChange={(next) => void setParams(next)}
        />
        {allUsers ? (
          <div className="w-full sm:w-64">
            <UserPicker
              aria-label="User"
              placeholder="User: All users"
              hideInvited
              clearable
              value={params.user}
              onChange={(user) => void setParams({ user, page: 1 })}
              knownLabels={Object.fromEntries(
                (all.data?.users.items ?? []).map((r) => [r.user.id, personName(r.user)]),
              )}
            />
          </div>
        ) : null}
      </div>

      {problem ? null : allUsers ? (
        <AllUsersReport query={all} onPage={(page) => void setParams({ page })} />
      ) : (
        <MyReportBody query={mine} />
      )}
    </>
  );
}

function Legend() {
  return <p className="mt-4 type-caption">{REPORT_LEGEND}</p>;
}

function AllUsersReport({
  query,
  onPage,
}: {
  query: ReturnType<typeof useReport>;
  onPage: (page: number) => void;
}) {
  const columns = useMemo<DataColumn<ReportUserRow>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: (r) => (
          <span className="flex flex-wrap items-center gap-2 font-medium">
            {personName(r.user)}
            {r.user.status === "INACTIVE" ? (
              <Badge variant="outline" className="text-muted-foreground">
                Inactive
              </Badge>
            ) : null}
          </span>
        ),
      },
      {
        id: "email",
        header: "Email",
        cell: (r) => <span className="text-muted-foreground">{r.user.email}</span>,
      },
      ...FREQUENCIES.map((f): DataColumn<ReportUserRow> => ({
        id: f,
        header: FREQUENCY_LABELS[f],
        cell: (r) => <FrequencyCell counts={r.frequencies.find((c) => c.frequency === f)} />,
      })),
    ],
    [],
  );

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading the report">
        <Skeleton className="h-24 w-full rounded-xl" />
        <TableSkeleton rows={5} />
      </div>
    );
  }
  if (query.isError) {
    return <ErrorState message={toUserMessage(query.error)} onRetry={() => void query.refetch()} />;
  }
  const { summary, users } = query.data;

  return (
    <div className="flex flex-col gap-8" aria-busy={query.isFetching}>
      <section aria-labelledby="summary-title" className="flex flex-col gap-3">
        <h2 id="summary-title" className="type-section-title">
          Overall Frequency Summary
        </h2>
        <FrequencySummary summary={summary} />
      </section>

      <section aria-labelledby="users-title" className="flex flex-col gap-3">
        <h2 id="users-title" className="type-section-title">
          User Wise Details
        </h2>
        {users.items.length === 0 ? (
          <EmptyState title="No users to show." />
        ) : (
          <>
            <DataTable
              caption="User wise details"
              rows={users.items}
              columns={columns}
              getRowId={(r) => r.user.id}
              refreshing={query.isFetching}
              renderCard={(r) => (
                <Card size="sm">
                  <CardContent className="flex flex-col gap-2">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {personName(r.user)}
                      {r.user.status === "INACTIVE" ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactive
                        </Badge>
                      ) : null}
                    </p>
                    <ul className="flex flex-col divide-y">
                      {FREQUENCIES.map((f) => {
                        const c = r.frequencies.find((x) => x.frequency === f);
                        return (
                          <li
                            key={f}
                            className="flex flex-wrap items-center justify-between gap-2 py-1.5"
                          >
                            <span className="text-sm font-medium">{FREQUENCY_LABELS[f]}</span>
                            {c && c.total > 0 ? (
                              <span className="flex flex-wrap items-center gap-2">
                                <CountsLine counts={c} />
                                <ReportStatus status={c.status} />
                              </span>
                            ) : (
                              <span className="text-sm text-neutral-status">No Task</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}
            />
            <DataTablePagination
              page={users.page}
              pageSize={users.page_size}
              total={users.total}
              totalPages={users.total_pages}
              onPageChange={onPage}
            />
          </>
        )}
        <Legend />
      </section>
    </div>
  );
}

function MyReportBody({ query }: { query: ReturnType<typeof useMyReport> }) {
  if (query.isPending) {
    return <Skeleton className="h-64 w-full rounded-xl" aria-label="Loading the report" />;
  }
  if (query.isError) {
    return <ErrorState message={toUserMessage(query.error)} onRetry={() => void query.refetch()} />;
  }
  return (
    <div aria-busy={query.isFetching}>
      <FrequencyCards frequencies={query.data.summary} />
      <Legend />
    </div>
  );
}
