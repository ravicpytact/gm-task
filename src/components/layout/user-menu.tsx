"use client";

import { KeyRound, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { CHANGE_OWN_PASSWORD } from "@/config/constants";
import { useCan, useLogout, useSession } from "@/lib/auth/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppearanceMenu } from "./appearance-controls";

export function UserMenu() {
  const { data } = useSession();
  const logout = useLogout();
  const canChangePassword = useCan(CHANGE_OWN_PASSWORD);
  if (!data) return null;

  const { first_name, last_name, email } = data.user;
  const name = `${first_name} ${last_name}`;
  const initials = `${first_name.charAt(0)}${last_name.charAt(0)}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2" aria-label={`Account menu for ${name}`}>
          <Avatar className="size-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span>{name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {email} · {data.role.name}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound aria-hidden /> My profile
          </Link>
        </DropdownMenuItem>
        {canChangePassword ? (
          <DropdownMenuItem asChild>
            <Link href="/profile?tab=password">
              <KeyRound aria-hidden /> Change password
            </Link>
          </DropdownMenuItem>
        ) : null}
        <AppearanceMenu />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout()}>
          <LogOut aria-hidden /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
