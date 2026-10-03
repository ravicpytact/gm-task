"use client";

import { ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { APP_NAME } from "@/config/constants";
import { HOME_PATH } from "@/lib/auth/constants";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { saveSidebarPreference, type SidebarPreference } from "@/lib/stores/sidebar-preference";
import { SidebarNav } from "./nav-links";

/** "auto": the person never chose, so screen width decides (icons only on tablets, full on desktop). */
type Mode = SidebarPreference | "auto";

/** Classes per mode. "auto" is pure CSS, so the server's first render already has the right width. */
const WIDTH: Record<Mode, string> = { expanded: "w-64", collapsed: "w-16", auto: "w-16 lg:w-64" };
const LABEL: Record<Mode, string> = {
  expanded: "",
  collapsed: "sr-only",
  auto: "sr-only lg:not-sr-only",
};

/**
 * Desktop and tablet sidebar (phones use the bottom bar). It collapses to icons with the round
 * button on its edge; the choice is remembered per device.
 */
export function Sidebar({ initial }: { initial: SidebarPreference | null }) {
  const [mode, setMode] = useState<Mode>(initial ?? "auto");
  const isDesktop = useMediaQuery("(min-width: 64rem)"); // Tailwind's lg
  const collapsed = mode === "collapsed" || (mode === "auto" && !isDesktop);

  const toggle = () => {
    const next: SidebarPreference = collapsed ? "expanded" : "collapsed";
    setMode(next);
    saveSidebarPreference(next);
  };

  return (
    <aside
      id="app-sidebar"
      className={`sticky top-0 z-40 hidden h-dvh shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar px-2 py-4 text-sidebar-foreground transition-[width] duration-200 ease-out motion-reduce:transition-none md:flex ${WIDTH[mode]}`}
    >
      <Link
        href={HOME_PATH}
        className="flex items-center gap-2 px-2 font-semibold whitespace-nowrap"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ListChecks className="size-5" aria-hidden />
        </span>
        <span className={LABEL[mode]}>{APP_NAME}</span>
      </Link>

      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <SidebarNav collapsed={collapsed} labelClassName={LABEL[mode]} />
      </div>

      {/* Round toggle on the sidebar's edge. Always visible; the after: layer enlarges the tap area. */}
      <button
        type="button"
        onClick={toggle}
        aria-controls="app-sidebar"
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute top-5 -right-3.5 flex size-7 items-center justify-center rounded-full border border-sidebar-border bg-card text-sidebar-foreground shadow-card transition-colors after:absolute after:-inset-2 hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {collapsed ? (
          <ChevronRight className="size-4" aria-hidden />
        ) : (
          <ChevronLeft className="size-4" aria-hidden />
        )}
      </button>
    </aside>
  );
}
