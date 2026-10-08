"use client";

import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import { NAVIGATION, type NavItem } from "@/config/constants";
import { useSession } from "@/lib/auth/client";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
            data-nav={href}
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

const BOTTOM_ITEM =
  "flex min-h-14 w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-primary data-[active=true]:font-medium data-[active=true]:text-primary";

/**
 * The phone's bottom bar: the items marked `mobile`, and a "More" item opening a sheet with the
 * rest this person may use (an Admin's Users, Tasks and Task Assignments). No rest, no More, so a
 * User's bar keeps its five items.
 */
export function BottomNav() {
  const pathname = usePathname();
  const visible = useVisibleItems((item) => item.mobile === true);
  const more = useVisibleItems((item) => item.mobile !== true);
  const [moreOpen, setMoreOpen] = useState(false);
  // On one of the More pages, More is the highlighted item.
  const inMore = more.some((item) => isActive(pathname, item.href));

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
              data-nav={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={BOTTOM_ITEM}
            >
              <Icon className="size-5" aria-hidden />
              {shortLabel ?? label}
            </Link>
          </li>
        ))}
        {more.length > 0 ? (
          <li className="flex-1">
            <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
              <DrawerTrigger asChild>
                <button type="button" data-active={inMore} className={BOTTOM_ITEM}>
                  <Ellipsis className="size-5" aria-hidden />
                  More
                </button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>More</DrawerTitle>
                  <DrawerDescription className="sr-only">More pages of the app</DrawerDescription>
                </DrawerHeader>
                <ul className="flex flex-col gap-1 px-4 pb-6">
                  {more.map(({ href, label, icon: Icon }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        data-nav={href}
                        aria-current={isActive(pathname, href) ? "page" : undefined}
                        onClick={() => setMoreOpen(false)}
                        className="flex min-h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium transition-colors hover:bg-muted aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
                      >
                        <Icon className="size-5 shrink-0" aria-hidden />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </DrawerContent>
            </Drawer>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
