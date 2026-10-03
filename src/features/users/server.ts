import "server-only";
import { createLoader } from "nuqs/server";
import { getServerApi } from "@/lib/api/server";
import { getQueryClient } from "@/lib/query/query-client";
import { getMyProfile, listUsers } from "./api";
import { userListParsers } from "./constants";
import { userQueries } from "./queries";
import { toUserListQuery } from "./utils";

const loadUserListParams = createLoader(userListParsers);

/** Prefetch for the User List route, keyed exactly like the browser's query (FE-BOUND-004). */
export async function prefetchUserList(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const query = toUserListQuery(loadUserListParams(searchParams));
  const api = await getServerApi();
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    ...userQueries.list(query),
    queryFn: () => listUsers(api, query),
  });
  return queryClient;
}

export async function prefetchMyProfile() {
  const api = await getServerApi();
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({ ...userQueries.me(), queryFn: () => getMyProfile(api) });
  return queryClient;
}
