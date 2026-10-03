import "server-only";
import { createHash } from "node:crypto";
import { serverEnv } from "@/config/server-env";
import { ApiError, unwrap } from "@/lib/api";
import { createApiClient } from "@/lib/api/client";
import type { TokenPair } from "./cookies";
import { createSingleFlight } from "./single-flight";

/** New tokens, or the backend's reason for refusing (the session is over). */
export type RefreshOutcome = { ok: true; tokens: TokenPair } | { ok: false; code: string };

/**
 * The only caller of the backend's refresh operation (FE-AUTH-003).
 *
 * Refresh tokens rotate, and the backend revokes every session of a person when a spent token is
 * used again. So concurrent requests holding the same refresh token share one refresh, and
 * requests arriving up to 30 seconds later with the old token get the same new pair.
 *
 * Only route handlers call this. src/proxy.ts is bundled separately and would hold its own,
 * unshared copy of the map.
 */
const runOnce = createSingleFlight<RefreshOutcome>(30_000);

export function refreshSession(refreshToken: string): Promise<RefreshOutcome> {
  const key = createHash("sha256").update(refreshToken).digest("hex");
  return runOnce(key, () => callBackendRefresh(refreshToken));
}

async function callBackendRefresh(refreshToken: string): Promise<RefreshOutcome> {
  const api = createApiClient(serverEnv.API_BASE_URL);
  try {
    const tokens = await unwrap(
      api.POST("/v1/auth/refresh", { body: { refresh_token: refreshToken } }),
    );
    return { ok: true, tokens };
  } catch (error) {
    // INVALID_TOKEN, TOKEN_REUSED, ACCOUNT_INACTIVE: the session is over, and the reason matters.
    if (error instanceof ApiError && error.status === 401) return { ok: false, code: error.code };
    throw error; // backend unreachable or failing: keep the session, report the outage
  }
}
