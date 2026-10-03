"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { NAVIGATION, type NavItem } from "@/config/constants";
import { useSession } from "@/lib/auth/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Navigation items this person may use, by permission code (FE-AUTH-005). */
function useVisibleItems(filter: (item: NavItem) => boolean = () => true): NavItem[] {
  const { data } = useSession();
  const permissions = data?.permissions ?? [];
  return NAVIGATION.filter(
    (item) => filter(item) && (!item.permission || permissions.includes(item.permission)),
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The sidebar's links. When the sidebar is collapsed, labels stay in the page for screen readers
 * (`labelClassName` hides them visually) and each icon gets a tooltip with its name.
 */
export function SidebarNav({
  collapsed,
  labelClassName,
}: {
  collapsed: boolean;
  labelClassName: string;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {useVisibleItems().map(({ href, label, icon: Icon }) => {
        const link = (
          <Link
            href={href}
            aria-current={isActive(pathname, href) ? "page" : undefined}
            className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-[current=page]:bg-sidebar-primary aria-[current=page]:text-sidebar-primary-foreground aria-[current=page]:shadow-card"
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className={labelClassName}>{label}</span>
          </Link>
        );
        return collapsed ? (
          <Tooltip key={href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ) : (
          <Fragment key={href}>{link}</Fragment>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const visible = useVisibleItems((item) => item.mobile === true);
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-safe md:hidden"
    >
      <ul className="flex">
        {visible.map(({ href, label, shortLabel, icon: Icon }) => (
          <li key={href} className="flex-1">
            <Link
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-primary"
            >
              <Icon className="size-5" aria-hidden />
              {shortLabel ?? label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
