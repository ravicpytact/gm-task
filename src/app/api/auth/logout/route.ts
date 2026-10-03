import { serverEnv } from "@/config/server-env";
import { BACKEND_AUTH_PATHS } from "@/lib/auth/constants";
import { clearSessionCookies, readSessionCookies } from "@/lib/auth/cookies";
import { assertSameOrigin } from "@/lib/auth/origin";

/** Revokes this device's refresh token at the backend and always clears the cookies (FE-AUTH-006). */
export async function POST(request: Request) {
  const denied = assertSameOrigin(request);
  if (denied) return denied;

  const { accessToken, refreshToken } = await readSessionCookies();
  if (refreshToken) {
    try {
      await fetch(new URL(BACKEND_AUTH_PATHS.logout, serverEnv.API_BASE_URL), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": crypto.randomUUID(),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });
    } catch {
      // The local session ends regardless; the refresh token expires on its own.
    }
  }
  await clearSessionCookies();
  return new Response(null, { status: 204 });
}
