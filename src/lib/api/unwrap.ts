import { ApiError } from "./errors";

/** What an openapi-fetch call resolves to, seen through the backend's envelope. */
type ClientResult<E> = { data?: E; error?: unknown; response: Response };
type Envelope = { data?: unknown };

/** The payload inside `{ data, message }`. */
export type Payload<E> = E extends { data?: infer D } ? NonNullable<D> : never;

async function settle<E>(call: Promise<ClientResult<E>>): Promise<ClientResult<E>> {
  let result: ClientResult<E>;
  try {
    result = await call;
  } catch (cause) {
    if (cause instanceof ApiError) throw cause;
    throw ApiError.network(cause, null);
  }
  if (result.error !== undefined || !result.response.ok) {
    throw ApiError.fromResponse(result.response, result.error);
  }
  return result;
}

function payloadOf<E extends Envelope>(result: ClientResult<E>): Payload<E> {
  const payload = result.data?.data;
  if (payload === undefined || payload === null) {
    throw new ApiError(
      result.response.status,
      "EMPTY_RESPONSE",
      "The response had no data",
      [],
      result.response.headers.get("X-Request-ID"),
      false,
    );
  }
  return payload as Payload<E>;
}

/** Returns the envelope's `data`, or throws ApiError (FE-API-003). */
export async function unwrap<E extends Envelope>(
  call: Promise<ClientResult<E>>,
): Promise<Payload<E>> {
  return payloadOf(await settle(call));
}

/** For a single resource: its data and the version tag a later write must send (FE-API-005). */
export async function unwrapWithEtag<E extends Envelope>(
  call: Promise<ClientResult<E>>,
): Promise<{ data: Payload<E>; etag: string }> {
  const result = await settle(call);
  const etag = result.response.headers.get("ETag");
  if (!etag) {
    throw new ApiError(
      result.response.status,
      "MISSING_ETAG",
      "The response had no ETag",
      [],
      result.response.headers.get("X-Request-ID"),
      false,
    );
  }
  return { data: payloadOf(result), etag };
}

/** For operations answering 204 or a message-only envelope. */
export async function unwrapEmpty<E>(call: Promise<ClientResult<E>>): Promise<void> {
  await settle(call);
}
