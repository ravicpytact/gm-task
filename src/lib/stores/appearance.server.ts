import "server-only";
import { cookies } from "next/headers";
import { ACCENT_COOKIE, parseAccent, type Accent } from "./appearance";

/** The saved accent theme, or the default when this device never chose one. */
export async function readAccent(): Promise<Accent> {
  return parseAccent((await cookies()).get(ACCENT_COOKIE)?.value);
}
