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

/**
 * Between the browser and the app's own server, the resource version travels in our own headers.
 * Hosting edges (e.g. Vercel) apply HTTP conditional-request rules to `If-Match` / `ETag` themselves:
 * after a successful save the new ETag differs from the If-Match sent, and the edge replaces the
 * success with its own 412. The app server translates to the standard headers towards the backend.
 */
export const VERSION_HEADER = "X-ETag";
export const IF_VERSION_HEADER = "X-If-Match";

const versionHeadersMiddleware: Middleware = {
  onRequest({ request }) {
    const version = request.headers.get("If-Match");
    if (version) {
      request.headers.delete("If-Match");
      request.headers.set(IF_VERSION_HEADER, version);
    }
    return request;
  },
};

/** The only place an HTTP client is created (FE-API-001). */
export function createApiClient(
  baseUrl: string,
  headers?: Record<string, string>,
  options: { viaAppServer?: boolean } = {},
) {
  const client = createClient<paths>(headers ? { baseUrl, headers } : { baseUrl });
  client.use(requestIdMiddleware);
  if (options.viaAppServer) client.use(versionHeadersMiddleware);
  return client;
}
