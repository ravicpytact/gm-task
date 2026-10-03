import { serverEnv } from "@/config/server-env";
import type { Schemas } from "@/lib/api";
import { envelope } from "@/lib/auth/backend-proxy";
import { BACKEND_AUTH_PATHS } from "@/lib/auth/constants";
import { setSessionCookies } from "@/lib/auth/cookies";
import { assertSameOrigin } from "@/lib/auth/origin";

/** Exchanges credentials for session cookies. The tokens never reach the browser (FE-AUTH-001). */
export async function POST(request: Request) {
  const denied = assertSameOrigin(request);
  if (denied) return denied;

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  let backend: Response;
  try {
    backend = await fetch(new URL(BACKEND_AUTH_PATHS.login, serverEnv.API_BASE_URL), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Request-ID": requestId },
      body: await request.text(),
      cache: "no-store",
    });
  } catch {
    return envelope(502, "BACKEND_UNAVAILABLE", "The service is unavailable. Try again shortly.");
  }

  const headers = { "X-Request-ID": backend.headers.get("x-request-id") ?? requestId };
  if (!backend.ok) {
    // Wrong password, inactive account, rate limit: the backend's envelope, unchanged.
    return new Response(backend.body, {
      status: backend.status,
      headers: {
        ...headers,
        "Content-Type": backend.headers.get("content-type") ?? "application/json",
      },
    });
  }

  const { data, message } = (await backend.json()) as Schemas["StandardResponse_TokenPairRead_"];
  if (!data) return envelope(502, "EMPTY_RESPONSE", "The service sent an empty response.");
  await setSessionCookies(data);
  return Response.json({ data: { user: data.user }, message }, { headers });
}
