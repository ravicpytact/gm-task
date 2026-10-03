import "server-only";
import { serverEnv } from "@/config/server-env";

const appOrigin = new URL(serverEnv.APP_ORIGIN).origin;

/**
 * State-changing route handlers accept only requests from the app's own pages (FE-AUTH-007).
 * Returns a 403 response to send back, or null when the request may proceed.
 */
export function assertSameOrigin(request: Request): Response | null {
  if (request.headers.get("sec-fetch-site") === "same-origin") return null;
  const origin = request.headers.get("origin");
  if (origin !== null && origin === appOrigin) return null;
  return forbiddenOrigin();
}

/** For the refresh route, reached by a top-level redirect: same-origin, or typed into the address bar. */
export function assertNavigationFromSelf(request: Request): Response | null {
  const site = request.headers.get("sec-fetch-site");
  return site === "same-origin" || site === "none" ? null : forbiddenOrigin();
}

function forbiddenOrigin() {
  return Response.json(
    {
      error: { code: "FORBIDDEN_ORIGIN", details: [] },
      message: "This request was not sent from this app.",
    },
    { status: 403 },
  );
}
