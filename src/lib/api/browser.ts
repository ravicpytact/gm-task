import { createApiClient } from "./client";

/**
 * The browser's client. It calls the app's own server, which attaches the session and
 * forwards to the backend (FE-AUTH-002). Endpoint functions receive it from the state layer.
 */
export const browserApi = createApiClient("/api/backend");
