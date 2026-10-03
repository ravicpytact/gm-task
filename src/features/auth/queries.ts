import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/lib/api/browser";
import { changePassword, signIn, type PasswordChange } from "@/lib/auth/client";
import {
  acceptInvitation,
  requestPasswordReset,
  resetPassword,
  verifyInvitation,
  verifyResetLink,
} from "./api";
import type { AcceptInvitation, ResetPassword } from "./types";
import type { LoginValues } from "./schemas";

export const authKeys = {
  all: ["auth"] as const,
  invitation: (token: string) => [...authKeys.all, "invitation", token] as const,
  resetLink: (token: string) => [...authKeys.all, "reset-link", token] as const,
};

/** A one-time link is checked once when its screen opens; a refusal is final, so no retries. */
const linkCheck = { retry: false, staleTime: Infinity, gcTime: 0, meta: { public: true } } as const;

/** Runs without a session: a 401 here is an answer, not an ended session (see lib/query). */
const PUBLIC = { meta: { public: true } } as const;

export const authQueries = {
  invitation: (token: string) =>
    queryOptions({
      queryKey: authKeys.invitation(token),
      queryFn: () => verifyInvitation(browserApi, token),
      ...linkCheck,
    }),
  resetLink: (token: string) =>
    queryOptions({
      queryKey: authKeys.resetLink(token),
      queryFn: () => verifyResetLink(browserApi, token),
      ...linkCheck,
    }),
};

export const useInvitation = (token: string) => useQuery(authQueries.invitation(token));
export const useResetLink = (token: string) => useQuery(authQueries.resetLink(token));

/** Signing in replaces whoever was signed in before, so it clears the whole cache (FE-DATA-003). */
export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: LoginValues) => signIn(values),
    ...PUBLIC,
    onSuccess: () => queryClient.clear(),
  });
}

// The mutations below change no cached server data: the public ones run without a session, and a
// password change leaves this session and everything it shows untouched. Nothing to invalidate.

export const useAcceptInvitation = () =>
  useMutation({
    mutationFn: (body: AcceptInvitation) => acceptInvitation(browserApi, body),
    ...PUBLIC,
  });

export const useRequestPasswordReset = () =>
  useMutation({
    mutationFn: (email: string) => requestPasswordReset(browserApi, email),
    ...PUBLIC,
  });

export const useResetPassword = () =>
  useMutation({ mutationFn: (body: ResetPassword) => resetPassword(browserApi, body), ...PUBLIC });

export const useChangePassword = () =>
  useMutation({ mutationFn: (change: PasswordChange) => changePassword(change) });
