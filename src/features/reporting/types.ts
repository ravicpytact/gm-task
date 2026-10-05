import type { Operations, Schemas } from "@/lib/api";

export type Report = Schemas["ReportRead"];
export type MyReport = Schemas["MyReportRead"];
export type FrequencyCounts = Schemas["FrequencyCounts"];
export type ReportRange = Schemas["ReportRange"];
export type ReportUserRow = Schemas["ReportUserRow"];

export type ReportQuery = NonNullable<
  Operations["get_report_v1_reports_get"]["parameters"]["query"]
>;
export type MyReportQuery = NonNullable<
  Operations["get_my_report_v1_me_report_get"]["parameters"]["query"]
>;
export type RangeType = NonNullable<ReportQuery["range_type"]>;
