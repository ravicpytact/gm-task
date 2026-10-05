import { unwrap, type ApiClient } from "@/lib/api";
import type { MyReportQuery, ReportQuery } from "./types";

/** Admin: the summary of all chosen users plus a page of user rows. */
export const getReport = (api: ApiClient, query: ReportQuery) =>
  unwrap(api.GET("/v1/reports", { params: { query } }));

export const getMyReport = (api: ApiClient, query: MyReportQuery) =>
  unwrap(api.GET("/v1/me/report", { params: { query } }));
