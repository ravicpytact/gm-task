import { isServer, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

/**
 * `meta.public`: the operation runs without a session (sign-in, invitation and reset links), so its
 * 401 is an answer about the request ("Invalid email or password."), not a sign that a session ended.
 */
type OperationMeta = { public?: boolean };

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: OperationMeta;
    mutationMeta: OperationMeta;
  }
}

let onSessionEnded: (error: ApiError) => void = () => {};

/** Registered by the auth layer so a final 401 ends the session completely (FE-AUTH-006). */
export function setSessionEndedHandler(handler: (error: ApiError) => void) {
  onSessionEnded = handler;
}

function handleError(error: unknown, meta: OperationMeta | undefined) {
  if (meta?.public) return;
  // The backend proxy already tried to refresh; a 401 reaching the browser means the session ended.
  if (error instanceof ApiError && error.status === 401) onSessionEnded(error);
}

function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof ApiError && error.status > 0 && error.status < 500) return false;
  return failureCount < 2;
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: (error, query) => handleError(error, query.meta) }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => handleError(error, mutation.meta),
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000, // no immediate refetch after hydration
        retry: shouldRetry,
      },
      mutations: { retry: false },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** A new cache per server request; one cache per browser tab (FE-DATA-001). */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
