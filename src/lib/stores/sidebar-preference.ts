// The sidebar's open/closed choice: a per-device UI preference, not personal data, so it survives
// sign-out. A cookie (not localStorage) lets the server render the right width with no jump on load.
export const SIDEBAR_COOKIE = "sidebar_state";

export type SidebarPreference = "expanded" | "collapsed";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function parseSidebarPreference(value: string | undefined): SidebarPreference | null {
  return value === "expanded" || value === "collapsed" ? value : null;
}

/** Browser only. */
export function saveSidebarPreference(preference: SidebarPreference) {
  document.cookie = `${SIDEBAR_COOKIE}=${preference}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}
