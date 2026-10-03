import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

export type FieldIssue = { field: string; issue: string };

/** The one error type every failed request becomes (FE-API-003). */
export class ApiError extends Error {
  constructor(
    /** HTTP status; 0 when the request never got a response. */
    readonly status: number,
    /** Backend `error.code`, or NETWORK_ERROR / HTTP_<status> when there was none. */
    readonly code: string,
    message: string,
    readonly details: FieldIssue[],
    readonly requestId: string | null,
    /** True when `message` came from the backend and is written for people. */
    readonly hasBackendMessage: boolean,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static fromResponse(response: Response, body: unknown): ApiError {
    const envelope = isEnvelope(body) ? body : undefined;
    return new ApiError(
      response.status,
      envelope?.error?.code ?? `HTTP_${response.status}`,
      envelope?.message ?? response.statusText,
      envelope?.error?.details ?? [],
      response.headers.get("X-Request-ID"),
      envelope?.message !== undefined,
    );
  }

  static network(cause: unknown, requestId: string | null): ApiError {
    const error = new ApiError(0, "NETWORK_ERROR", "Network request failed", [], requestId, false);
    error.cause = cause;
    return error;
  }
}

type ErrorEnvelope = { message?: string; error?: { code?: string; details?: FieldIssue[] } | null };

function isEnvelope(body: unknown): body is ErrorEnvelope {
  return typeof body === "object" && body !== null && ("error" in body || "message" in body);
}

const GENERIC = "Something went wrong. Try again.";

const BY_STATUS: Partial<Record<number, string>> = {
  401: "Your session has ended. Please sign in again.",
  403: "You don't have permission to do this.",
  404: "We couldn't find what you were looking for.",
  412: "Someone else changed this. Reload to see their changes.",
  429: "Too many attempts. Try again in a moment.",
};

/**
 * Words for a person, never raw error text (FE-API-004).
 * Backend messages for 4xx are written for people and are shown as they are; everything else
 * falls back to the status table, and unexpected errors carry the request ID for support.
 */
export function toUserMessage(
  error: unknown,
  overrides: Partial<Record<string, string>> = {},
): string {
  if (!(error instanceof ApiError)) return GENERIC;
  const override = overrides[error.code];
  if (override) return override;
  if (error.status >= 400 && error.status < 500 && error.hasBackendMessage) return error.message;
  const known = BY_STATUS[error.status];
  if (known) return known;
  return error.requestId ? `${GENERIC} (Ref: ${error.requestId})` : GENERIC;
}

/** Puts backend field details under their form fields. Returns true if any were applied. */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof ApiError) || error.details.length === 0) return false;
  for (const { field, issue } of error.details) {
    setError(field as Path<T>, { type: "server", message: issue });
  }
  return true;
}
