import "server-only";
import { createLoader } from "nuqs/server";
import { getServerApi } from "@/lib/api/server";
import { getQueryClient } from "@/lib/query/query-client";
import {
  getTodoCalendar,
  getTodoSummary,
  listAssignments,
  listAllHistory,
  listMyAssignments,
  listMyHistory,
  listMyTasks,
  listMyTodos,
} from "./api";
import {
  assignmentListParsers,
  historyParsers,
  myTasksParsers,
  todoListParsers,
} from "./constants";
import { assignmentQueries, todoQueries } from "./queries";
import {
  monthOf,
  toAllHistoryQuery,
  toAssignmentListQuery,
  toHistoryQuery,
  toMyAssignmentListQuery,
  toTodoListQuery,
  todayIso,
} from "./utils";

const loadAssignmentListParams = createLoader(assignmentListParsers);

/** Prefetch for the Assignment List route, keyed exactly like the browser's query (FE-BOUND-004). */
export async function prefetchAssignmentList(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const query = toAssignmentListQuery(loadAssignmentListParams(searchParams));
  const api = await getServerApi();
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    ...assignmentQueries.list(query),
    queryFn: () => listAssignments(api, query),
  });
  return queryClient;
}

type SearchParams = Record<string, string | string[] | undefined>;

const loadTodoListParams = createLoader(todoListParsers);
const loadHistoryParams = createLoader(historyParsers);

/** Todos: the Todo list, the counts and the calendar of the chosen day (today by default). */
export async function prefetchTodos(searchParams: SearchParams) {
  const params = loadTodoListParams(searchParams);
  const query = toTodoListQuery(params);
  const month = params.date ? monthOf(params.date) : null;
  const api = await getServerApi();
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      ...todoQueries.list(query),
      queryFn: () => listMyTodos(api, query),
    }),
    queryClient.prefetchQuery({
      ...todoQueries.summary(params.date),
      queryFn: () => getTodoSummary(api, params.date),
    }),
    queryClient.prefetchQuery({
      ...todoQueries.calendar(month),
      queryFn: () => getTodoCalendar(api, month),
    }),
  ]);
  return queryClient;
}

/** History: everyone's for Admins (read_all), otherwise my own and the tasks for its filter. */
export async function prefetchHistory(searchParams: SearchParams, allUsers: boolean) {
  const params = loadHistoryParams(searchParams);
  const api = await getServerApi();
  const queryClient = getQueryClient();
  if (allUsers) {
    const query = toAllHistoryQuery(params, todayIso());
    await queryClient.prefetchQuery({
      ...todoQueries.allHistory(query),
      queryFn: () => listAllHistory(api, query),
    });
    return queryClient;
  }
  const query = toHistoryQuery(params, todayIso());
  await Promise.all([
    queryClient.prefetchQuery({
      ...todoQueries.history(query),
      queryFn: () => listMyHistory(api, query),
    }),
    queryClient.prefetchQuery({ ...todoQueries.myTasks(), queryFn: () => listMyTasks(api) }),
  ]);
  return queryClient;
}

const loadMyTasksParams = createLoader(myTasksParsers);

/** My tasks (Users): the list as the URL asks for it, Active by default. */
export async function prefetchMyTasks(searchParams: SearchParams) {
  const query = toMyAssignmentListQuery(loadMyTasksParams(searchParams));
  const api = await getServerApi();
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    ...assignmentQueries.mine(query),
    queryFn: () => listMyAssignments(api, query),
  });
  return queryClient;
}
