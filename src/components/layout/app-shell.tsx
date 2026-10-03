import { ListChecks } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { clientEnv } from "@/config/client-env";
import { APP_NAME } from "@/config/constants";
import { HOME_PATH } from "@/lib/auth/constants";
import { readSidebarPreference } from "@/lib/stores/sidebar-preference.server";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "./nav-links";
import { Sidebar } from "./sidebar";
import { UserMenu } from "./user-menu";

/**
 * The signed-in frame. Phones: top bar and bottom navigation. From `md`: a collapsible sidebar
 * (FE-UI-005). Navigation comes from config; the shell knows no feature (FE-STRUCT-004).
 */
export async function AppShell({ children }: { children: ReactNode }) {
  const environment = clientEnv.NEXT_PUBLIC_APP_ENV;
  const sidebarPreference = await readSidebarPreference();
  return (
    <div className="flex min-h-dvh flex-1">
      <Sidebar initial={sidebarPreference} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur">
          <div className="md:hidden">
            <Brand />
          </div>
          {environment !== "production" ? (
            <Badge variant="outline" className="uppercase">
              {environment}
            </Badge>
          ) : null}
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>
        <main id="main" className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

function Brand() {
  return (
    <Link href={HOME_PATH} className="flex items-center gap-2 font-semibold">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ListChecks className="size-5" aria-hidden />
      </span>
      {APP_NAME}
    </Link>
  );
}
