import "server-only";
import type { NextRequest } from "next/server";
import { serverEnv } from "@/config/server-env";
import { ACCOUNT_INACTIVE } from "./constants";
import {
  clearSessionCookies,
  readSessionCookies,
  setSessionCookies,
  type TokenPair,
} from "./cookies";
import { assertSameOrigin } from "./origin";
import { refreshSession } from "./refresh";

/** Every /api/backend answer: private to this browser, and checked with the server before reuse. */
export const API_CACHE_CONTROL = "private, no-cache";
const SAFE_METHODS = new Set(["GET", "HEAD"]);
const REQUEST_HEADERS = ["accept", "content-type", "x-request-id"];
const RESPONSE_HEADERS = ["content-type", "content-disposition", "retry-after", "x-request-id"];

type ProxyContext = { params: Promise<{ path: string[] }> };

/** The session's current tokens, as seen by one backend call. */
export type SessionTokens = { accessToken: string | undefined; refreshToken: string | undefined };

/**
 * Calls the backend with the session (FE-AUTH-002, FE-AUTH-003). `send` receives the current tokens;
 * when the access token is missing or the backend answers 401, the session is renewed once and
 * `send` runs again with the new tokens. New cookies are set when a renewal happened.
 */
export async function callWithSession(
  send: (tokens: SessionTokens) => Promise<Response>,
): Promise<Response> {
  const tokens: SessionTokens = await readSessionCookies();
  const state: { renewed: TokenPair | null } = { renewed: null };

  /** Renews the session once. Returns a response to send instead, or null to carry on. */
  const renew = async (): Promise<Response | null> => {
    if (!tokens.refreshToken) return null;
    let outcome;
    try {
      outcome = await refreshSession(tokens.refreshToken);
    } catch {
      return envelope(503, "BACKEND_UNAVAILABLE", "The service is unavailable. Try again shortly.");
    }
    if (!outcome.ok) {
      await clearSessionCookies();
      return outcome.code === ACCOUNT_INACTIVE
        ? envelope(401, ACCOUNT_INACTIVE, "Your account is inactive. Contact the Admin.")
        : envelope(401, "SESSION_EXPIRED", "Your session has ended. Please sign in again.");
    }
    state.renewed = outcome.tokens;
    tokens.accessToken = outcome.tokens.access_token;
    tokens.refreshToken = outcome.tokens.refresh_token;
    return null;
  };

  if (!tokens.accessToken && tokens.refreshToken) {
    const stop = await renew();
    if (stop) return stop;
  }

  let response: Response;
  try {
    response = await send(tokens);
    if (response.status === 401 && tokens.refreshToken && !state.renewed) {
      const stop = await renew();
      if (stop) return stop;
      response = await send(tokens); // retried once, never more
    }
  } catch {
    return envelope(502, "BACKEND_UNAVAILABLE", "The service is unavailable. Try again shortly.");
  }

  if (state.renewed) await setSessionCookies(state.renewed);
  const headers = pick(response.headers, RESPONSE_HEADERS);
  // The version goes back as X-ETag only: an edge in front of this server (e.g. Vercel) would answer a
  // request carrying If-Match with its own 412 when the response's ETag differs: after every save.
  const version = response.headers.get("etag");
  if (version) headers.set("x-etag", version);
  // Never let the browser reuse an answer without asking: it would hand back an old ETag after a
  // save (a false 412 "changed by someone else"). It may keep a copy and revalidate (304).
  headers.set("cache-control", API_CACHE_CONTROL);
  return new Response(response.body, { status: response.status, headers });
}

/**
 * The backend proxy: the browser calls /api/backend/<path>, and this forwards the request to the
 * backend with the session's access token.
 */
export async function forwardToBackend(
  request: NextRequest,
  context: ProxyContext,
): Promise<Response> {
  if (!SAFE_METHODS.has(request.method)) {
    const denied = assertSameOrigin(request);
    if (denied) return denied;
  }

  const { path } = await context.params;
  if (path[0] !== "v1") return envelope(404, "NOT_FOUND", "Not found.");
  const target = backendUrl(`/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`);
  const body = SAFE_METHODS.has(request.method) ? undefined : await request.arrayBuffer();

  return callWithSession(({ accessToken }) =>
    fetch(target, {
      method: request.method,
      headers: towardsBackend(request.headers, accessToken),
      ...(body ? { body } : {}),
      cache: "no-store",
      redirect: "manual",
    }),
  );
}

/** The browser's headers for the backend; its X-If-Match (see lib/api/client.ts) becomes If-Match. */
function towardsBackend(source: Headers, accessToken: string | undefined): Headers {
  const headers = pick(source, REQUEST_HEADERS, accessToken);
  const version = source.get("x-if-match");
  if (version) headers.set("if-match", version);
  return headers;
}

export function backendUrl(path: string): URL {
  return new URL(path, serverEnv.API_BASE_URL);
}

function pick(source: Headers, names: string[], bearer?: string): Headers {
  const headers = new Headers();
  for (const name of names) {
    const value = source.get(name);
    if (value !== null) headers.set(name, value);
  }
  if (bearer) headers.set("authorization", `Bearer ${bearer}`);
  return headers;
}

/** An error in the backend's own envelope, so the API client treats it like any other. */
export function envelope(status: number, code: string, message: string): Response {
  return Response.json(
    { error: { code, details: [] }, message },
    { status, headers: { "cache-control": API_CACHE_CONTROL } },
  );
}
