// Every store registers a reset, so ending a session clears it (FE-AUTH-006, FE-DATA-006).
const resets = new Set<() => void>();

export function registerStoreReset(reset: () => void) {
  resets.add(reset);
}

export function resetAllStores() {
  for (const reset of resets) reset();
}
