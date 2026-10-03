import "server-only";
import { cookies } from "next/headers";
import { serverEnv } from "@/config/server-env";
import type { Schemas } from "@/lib/api";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./constants";

export type TokenPair = Pick<
  Schemas["TokenPairRead"],
  "access_token" | "refresh_token" | "expires_in"
>;

/** The access cookie expires this long before the token, so expiry shows as a missing cookie. */
const ACCESS_EXPIRY_MARGIN_SECONDS = 60;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true, // FE-AUTH-001
    secure: serverEnv.SESSION_COOKIE_SECURE,
    sameSite: "lax" as const, // FE-AUTH-007
    path: "/",
    maxAge,
  };
}

/** Only in route handlers: cookies cannot be set while rendering. */
export async function setSessionCookies(tokens: TokenPair) {
  const jar = await cookies();
  jar.set(
    ACCESS_COOKIE,
    tokens.access_token,
    cookieOptions(Math.max(tokens.expires_in - ACCESS_EXPIRY_MARGIN_SECONDS, 0)),
  );
  jar.set(
    REFRESH_COOKIE,
    tokens.refresh_token,
    cookieOptions(serverEnv.REFRESH_TOKEN_MAX_AGE_SECONDS),
  );
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export async function readSessionCookies() {
  const jar = await cookies();
  return {
    accessToken: jar.get(ACCESS_COOKIE)?.value,
    refreshToken: jar.get(REFRESH_COOKIE)?.value,
  };
}
