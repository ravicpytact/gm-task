import "server-only";
import { cookies } from "next/headers";
import {
  parseSidebarPreference,
  SIDEBAR_COOKIE,
  type SidebarPreference,
} from "./sidebar-preference";

/** The saved choice, or null when the person never chose (the layout then follows screen width). */
export async function readSidebarPreference(): Promise<SidebarPreference | null> {
  return parseSidebarPreference((await cookies()).get(SIDEBAR_COOKIE)?.value);
}
