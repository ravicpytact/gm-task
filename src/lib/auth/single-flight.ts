/**
 * Concurrent callers with the same key share one call, and callers arriving within `windowMs`
 * after it started receive the same result instead of starting another (FE-AUTH-003).
 * A call that throws is forgotten at once, so the next caller may retry.
 */
export function createSingleFlight<T>(windowMs: number, now: () => number = Date.now) {
  const recent = new Map<string, { promise: Promise<T>; until: number }>();

  return function run(key: string, call: () => Promise<T>): Promise<T> {
    const time = now();
    for (const [k, entry] of recent) {
      if (entry.until < time) recent.delete(k);
    }
    const hit = recent.get(key);
    if (hit) return hit.promise;

    const promise = call();
    recent.set(key, { promise, until: time + windowMs });
    promise.catch(() => recent.delete(key));
    return promise;
  };
}
