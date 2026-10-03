"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, type ReactNode } from "react";
import { ApiError, type Schemas } from "@/lib/api";
import { setSessionEndedHandler } from "@/lib/query/query-client";
import { resetAllStores } from "@/lib/stores/registry";
import { loginPath, sessionEndReason, type LoginReason } from "./constants";
import { sessionQuery } from "./session-query";

export function useSession() {
  return useQuery(sessionQuery());
}

/** "May this person do X?" by permission code, never by role name (FE-AUTH-005). */
export function useCan(code: string): boolean {
  const { data } = useSession();
  return data?.permissions.includes(code) ?? false;
}

export function Can({
  code,
  children,
  fallback = null,
}: {
  code: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useCan(code) ? children : fallback;
}

export type Credentials = Schemas["LoginRequest"];
export type SignedInUser = Schemas["LoginUserRead"];

/** A JSON POST to one of the app's own session routes; failures become ApiError. */
async function postToSessionRoute(path: string, payload: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Request-ID": crypto.randomUUID() },
      body: JSON.stringify(payload),
    });
  } catch (cause) {
    throw ApiError.network(cause, null);
  }
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) throw ApiError.fromResponse(response, body);
  return body;
}

/** Posts credentials to the app's server, which sets the session cookies (FE-AUTH-001). */
export async function signIn(credentials: Credentials): Promise<SignedInUser> {
  const body = await postToSessionRoute("/api/auth/login", credentials);
  return (body as { data: { user: SignedInUser } }).data.user;
}

export type PasswordChange = Omit<Schemas["ChangePasswordRequest"], "refresh_token">;

/**
 * The backend needs this device's refresh token to keep it signed in while signing out every other
 * device. Script cannot read that token (FE-AUTH-001), so the app's server adds it.
 */
export async function changePassword(change: PasswordChange): Promise<void> {
  await postToSessionRoute("/api/auth/change-password", change);
}

let ending = false;

/** The only way to end a session from the browser (FE-AUTH-006). */
export function useLogout() {
  const queryClient = useQueryClient();
  return useCallback(
    async (reason?: LoginReason) => {
      if (ending) return;
      ending = true;
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // The server clears cookies when reachable; locally we still clear everything below.
      }
      queryClient.clear();
      resetAllStores();
      window.location.replace(loginPath(reason)); // replace: Back cannot show the previous screen
    },
    [queryClient],
  );
}

/** Mounted once in the providers: a final 401 anywhere ends the session the same way. */
export function SessionEndedBridge() {
  const logout = useLogout();
  useEffect(() => {
    setSessionEndedHandler((error) => void logout(sessionEndReason(error.code)));
  }, [logout]);
  return null;
}
