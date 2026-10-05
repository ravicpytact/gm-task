import "server-only";
import { createLoader } from "nuqs/server";
import { getServerApi } from "@/lib/api/server";
import { getQueryClient } from "@/lib/query/query-client";
import { getMyReport, getReport } from "./api";
import { reportParsers } from "./constants";
import { reportQueries } from "./queries";
import { rangeProblem, toMyReportQuery, toReportQuery } from "./utils";

const loadReportParams = createLoader(reportParsers);

/** The Report route: all users for Admins (read_all), otherwise the person's own report. */
export async function prefetchReport(
  searchParams: Record<string, string | string[] | undefined>,
  allUsers: boolean,
) {
  const params = loadReportParams(searchParams);
  const queryClient = getQueryClient();
  if (rangeProblem(params)) return queryClient;
  const api = await getServerApi();
  if (allUsers) {
    const query = toReportQuery(params);
    await queryClient.prefetchQuery({
      ...reportQueries.report(query),
      queryFn: () => getReport(api, query),
    });
  } else {
    const query = toMyReportQuery(params);
    await queryClient.prefetchQuery({
      ...reportQueries.mine(query),
      queryFn: () => getMyReport(api, query),
    });
  }
  return queryClient;
}
