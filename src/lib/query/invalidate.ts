import type { QueryClient } from "@tanstack/react-query";
import { sessionKeys } from "@/lib/auth/session-query";

/**
 * After a change that ripples across features (deleting a user or a task, renaming a task):
 * every list, detail, history and report may show it, so refresh all server data (FE-DATA-003).
 * The session (who is signed in, their permissions) is not affected and is kept.
 */
export function invalidateAllExceptSession(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] !== sessionKeys.all[0],
  });
}
