import { unwrap, type ApiClient } from "@/lib/api";

/** The welcome tour was finished or skipped: it is not shown again, on any device. Idempotent. */
export const completeTour = (api: ApiClient) => unwrap(api.PUT("/v1/me/tour"));
