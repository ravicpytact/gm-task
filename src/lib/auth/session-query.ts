import { queryOptions } from "@tanstack/react-query";
import { unwrap, type ApiClient, type Schemas } from "@/lib/api";
import { browserApi } from "@/lib/api/browser";

/** The signed-in person and their permission codes, shared by every feature and the navigation. */
export type Session = {
  user: Schemas["UserRead"];
  role: Schemas["RoleRead"];
  permissions: string[];
};

export const sessionKeys = {
  all: ["session"] as const,
  current: () => [...sessionKeys.all, "current"] as const,
};

export async function fetchSession(api: ApiClient): Promise<Session> {
  const [user, access] = await Promise.all([
    unwrap(api.GET("/v1/me")),
    unwrap(api.GET("/v1/me/permissions")),
  ]);
  return { user, role: access.role, permissions: access.permissions };
}

/**
 * The browser's session query. The server writes the same key with setQueryData during
 * prefetchSession, so the hydrated session is reused rather than fetched again.
 */
export function sessionQuery() {
  return queryOptions({
    queryKey: sessionKeys.current(),
    queryFn: () => fetchSession(browserApi),
    staleTime: 5 * 60_000,
  });
}
