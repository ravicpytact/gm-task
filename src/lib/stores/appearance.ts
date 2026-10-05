// Appearance: a per-device UI preference, not personal data, so it survives sign-out (FE-UI-010).
// The mode (light, dark or the device's setting) is kept by next-themes; the accent theme is a
// cookie, so the server renders the right colours with no flash on load.

export const MODES = ["light", "dark", "system"] as const;
export type Mode = (typeof MODES)[number];
export const MODE_LABELS: Record<Mode, string> = { light: "Light", dark: "Dark", system: "System" };

/** Accent themes, one per `[data-accent]` block in globals.css. Indigo is the brand default. */
export const ACCENTS = [
  "indigo",
  "blue",
  "cyan",
  "teal",
  "khaki",
  "mocha",
  "violet",
  "fuchsia",
  "slate",
  "stone",
] as const;
export type Accent = (typeof ACCENTS)[number];
export const DEFAULT_ACCENT: Accent = "indigo";
export const ACCENT_LABELS: Record<Accent, string> = {
  indigo: "Indigo",
  blue: "Blue",
  teal: "Teal",
  violet: "Violet",
  slate: "Slate",
  cyan: "Cyan",
  fuchsia: "Fuchsia",
  stone: "Stone",
  khaki: "Khaki",
  mocha: "Mocha",
};

export const ACCENT_COOKIE = "accent";
/** next-themes' storage key for the mode. */
export const MODE_STORAGE_KEY = "mode";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function parseAccent(value: string | undefined): Accent {
  return ACCENTS.find((a) => a === value) ?? DEFAULT_ACCENT;
}

/** The browser-tab icon in the accent's colour (rendered by `pnpm icons`). */
export const accentIconHref = (accent: Accent) => `/icons/mark-${accent}.svg`;

/** Browser only: applies the accent at once (colours and tab icon) and remembers it on this device. */
export function applyAccent(accent: Accent) {
  document.documentElement.dataset.accent = accent;
  for (const link of document.querySelectorAll<HTMLLinkElement>(
    'link[rel="icon"][type="image/svg+xml"]',
  )) {
    link.href = accentIconHref(accent);
  }
  document.cookie = `${ACCENT_COOKIE}=${accent}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}
