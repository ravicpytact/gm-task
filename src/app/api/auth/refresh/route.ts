import { type NextRequest, NextResponse } from "next/server";
import { loginPath, safeNextPath, sessionEndReason, type LoginReason } from "@/lib/auth/constants";
import { clearSessionCookies, readSessionCookies, setSessionCookies } from "@/lib/auth/cookies";
import { assertNavigationFromSelf } from "@/lib/auth/origin";
import { refreshSession } from "@/lib/auth/refresh";

/**
 * src/proxy.ts redirects a page request here when the access cookie has expired but a refresh
 * cookie remains. The refresh happens here, in a route handler, because only route handlers share
 * the single-flight deduplication (FE-AUTH-003).
 */
export async function GET(request: NextRequest) {
  const denied = assertNavigationFromSelf(request);
  if (denied) return denied;

  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const toLogin = (reason: LoginReason) =>
    NextResponse.redirect(new URL(loginPath(reason, next), request.url));

  const { refreshToken } = await readSessionCookies();
  if (!refreshToken) return toLogin("session-ended");

  let outcome;
  try {
    outcome = await refreshSession(refreshToken);
  } catch {
    return toLogin("unavailable");
  }
  if (!outcome.ok) {
    await clearSessionCookies();
    return toLogin(sessionEndReason(outcome.code));
  }
  await setSessionCookies(outcome.tokens);
  return NextResponse.redirect(new URL(next, request.url));
}
