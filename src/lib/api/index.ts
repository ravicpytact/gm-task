// Public surface of the API layer: types, unwrapping and error helpers.
// Clients are imported from their own modules so the boundary rules can see them:
// "@/lib/api/browser" in a feature's state layer, "@/lib/api/server" in server code only.
export type { ApiClient, Operations, Schemas } from "./client";
export { ApiError, applyFieldErrors, toUserMessage, type FieldIssue } from "./errors";
export { unwrap, unwrapEmpty, unwrapWithEtag, type Payload } from "./unwrap";
