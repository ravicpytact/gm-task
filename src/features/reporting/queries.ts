import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { browserApi } from "@/lib/api/browser";
import { getMyReport, getReport } from "./api";
import type { MyReportQuery, ReportQuery } from "./types";

export const reportKeys = {
  all: ["reports"] as const,
  report: (query: ReportQuery) => [...reportKeys.all, "all-users", query] as const,
  mine: (query: MyReportQuery) => [...reportKeys.all, "mine", query] as const,
};

// Counts change as people answer: no ETag, and only briefly fresh.
export const reportQueries = {
  report: (query: ReportQuery) =>
    queryOptions({
      queryKey: reportKeys.report(query),
      queryFn: () => getReport(browserApi, query),
      placeholderData: keepPreviousData,
      staleTime: 30_000,
    }),
  mine: (query: MyReportQuery) =>
    queryOptions({
      queryKey: reportKeys.mine(query),
      queryFn: () => getMyReport(browserApi, query),
      placeholderData: keepPreviousData,
      staleTime: 30_000,
    }),
};

export const useReport = (query: ReportQuery, enabled: boolean) =>
  useQuery({ ...reportQueries.report(query), enabled });
export const useMyReport = (query: MyReportQuery, enabled: boolean) =>
  useQuery({ ...reportQueries.mine(query), enabled });
