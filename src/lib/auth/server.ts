import "server-only";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { ApiError } from "@/lib/api";
import { getServerApi } from "@/lib/api/server";
import { getQueryClient } from "@/lib/query/query-client";
import { loginPath, sessionEndReason } from "./constants";
import { fetchSession, sessionKeys, type Session } from "./session-query";

type SessionResult = { session: Session } | { endedBecause: string };

/** One backend read per request, however many layouts ask. */
const getSession = cache(async (): Promise<SessionResult> => {
  try {
    return { session: await fetchSession(await getServerApi()) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { endedBecause: error.code };
    throw error;
  }
});

/** For a protected route group's layout (FE-AUTH-004). */
export async function requireSession(): Promise<Session> {
  const result = await getSession();
  if ("endedBecause" in result) redirect(loginPath(sessionEndReason(result.endedBecause)));
  return result.session;
}

/** For a permission-gated route group's layout (FE-AUTH-004). Renders forbidden.tsx when missing. */
export async function requirePermission(code: string): Promise<Session> {
  const session = await requireSession();
  if (!session.permissions.includes(code)) forbidden();
  return session;
}

/** Puts the session into a request cache for the browser to hydrate (FE-BOUND-004). */
export async function prefetchSession() {
  const session = await requireSession();
  const queryClient = getQueryClient();
  queryClient.setQueryData(sessionKeys.current(), session);
  return { session, queryClient };
}
