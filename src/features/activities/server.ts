import "server-only";
import { createLoader } from "nuqs/server";
import { getServerApi } from "@/lib/api/server";
import { getQueryClient } from "@/lib/query/query-client";
import { listTasks, listTaskTypes } from "./api";
import { taskListParsers } from "./constants";
import { taskQueries } from "./queries";
import { toTaskListQuery } from "./utils";

const loadTaskListParams = createLoader(taskListParsers);

/** Prefetch for the Task List route, keyed exactly like the browser's queries (FE-BOUND-004). */
export async function prefetchTaskList(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const query = toTaskListQuery(loadTaskListParams(searchParams));
  const api = await getServerApi();
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({ ...taskQueries.list(query), queryFn: () => listTasks(api, query) }),
    queryClient.prefetchQuery({ ...taskQueries.types(), queryFn: () => listTaskTypes(api) }),
  ]);
  return queryClient;
}
