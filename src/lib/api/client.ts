import createClient, { type Middleware } from "openapi-fetch";
import { ApiError } from "./errors";
import type { components, operations, paths } from "./schema";

export type Schemas = components["schemas"];
export type Operations = operations;
export type ApiClient = ReturnType<typeof createApiClient>;

/** Every request carries an X-Request-ID, and a network failure keeps it (FE-API-006). */
const requestIdMiddleware: Middleware = {
  onRequest({ request }) {
    if (!request.headers.has("X-Request-ID")) {
      request.headers.set("X-Request-ID", crypto.randomUUID());
    }
    return request;
  },
  onError({ request, error }) {
    return ApiError.network(error, request.headers.get("X-Request-ID"));
  },
};

/** The only place an HTTP client is created (FE-API-001). */
export function createApiClient(baseUrl: string, headers?: Record<string, string>) {
  const client = createClient<paths>(headers ? { baseUrl, headers } : { baseUrl });
  client.use(requestIdMiddleware);
  return client;
}
