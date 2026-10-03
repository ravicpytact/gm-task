import { backendUrl, callWithSession, envelope } from "@/lib/auth/backend-proxy";
import { BACKEND_AUTH_PATHS } from "@/lib/auth/constants";
import { assertSameOrigin } from "@/lib/auth/origin";

/**
 * Change Password (Screen 11). The backend keeps this device signed in by its refresh token and
 * signs out every other device; the token lives in an httpOnly cookie, so it is added here.
 */
export async function POST(request: Request) {
  const denied = assertSameOrigin(request);
  if (denied) return denied;

  const input = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const current_password = input?.current_password;
  const new_password = input?.new_password;
  if (typeof current_password !== "string" || typeof new_password !== "string") {
    return envelope(400, "VALIDATION_FAILED", "Enter your current and new password.");
  }
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  return callWithSession(({ accessToken, refreshToken }) => {
    if (!refreshToken) {
      return Promise.resolve(
        envelope(401, "SESSION_EXPIRED", "Your session has ended. Please sign in again."),
      );
    }
    return fetch(backendUrl(BACKEND_AUTH_PATHS.changePassword), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ current_password, new_password, refresh_token: refreshToken }),
      cache: "no-store",
    });
  });
}
