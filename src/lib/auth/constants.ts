// Session cookie names, the backend's auth operations, and the routes the session guards use.
export const ACCESS_COOKIE = "session_access";
export const REFRESH_COOKIE = "session_refresh";

export const BACKEND_AUTH_PATHS = {
  login: "/v1/auth/login",
  refresh: "/v1/auth/refresh",
  logout: "/v1/auth/logout",
  changePassword: "/v1/me/password",
} as const;

/** The backend's code for a deactivated account; the login screen says so instead of "session ended". */
export const ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE";

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/dashboard";

/** Why the login screen is shown (?reason=). The auth feature words each one. */
export type LoginReason =
  "session-ended" | "inactive" | "unavailable" | "account-ready" | "password-reset";

export function sessionEndReason(code: string | undefined): LoginReason {
  return code === ACCOUNT_INACTIVE ? "inactive" : "session-ended";
}

export function loginPath(reason?: LoginReason, next?: string): string {
  const params = new URLSearchParams();
  if (reason) params.set("reason", reason);
  if (next) params.set("next", next);
  const query = params.toString();
  return query ? `${LOGIN_PATH}?${query}` : LOGIN_PATH;
}

/** Routes reachable without a session. Everything else is protected by src/proxy.ts. */
export const PUBLIC_PATHS = ["/login", "/accept-invitation", "/forgot-password", "/reset-password"];

/** Only same-origin paths may be redirected to after login or refresh (no "//evil.com"). */
export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return HOME_PATH;
  }
  return next;
}
