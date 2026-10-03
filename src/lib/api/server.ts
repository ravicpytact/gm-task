import "server-only";
import { cookies } from "next/headers";
import { serverEnv } from "@/config/server-env";
import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { createApiClient } from "./client";

/** A client for server components and prefetching: the backend directly, with the session's token. */
export async function getServerApi() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return createApiClient(
    serverEnv.API_BASE_URL,
    token ? { Authorization: `Bearer ${token}` } : undefined,
  );
}
