"use client";

import { KeyRound, MoreHorizontal, Send, Trash2, UserCheck, UserX } from "lucide-react";
import { useCan } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { USER_PERMISSIONS } from "../constants";
import type { User } from "../types";
import { fullName } from "../utils";

export type UserAction = "resend" | "password-link" | "deactivate" | "activate" | "delete";

/** The row menu of the User List (docs/04-design/users/ui_data_contract.md §1, Row actions). */
export function UserRowActions({
  user,
  isSelf,
  onAction,
}: {
  user: User;
  /** The signed-in Admin's own row: no deactivate, no delete (USR-R4). */
  isSelf: boolean;
  onAction: (action: UserAction, user: User) => void;
}) {
  const canInvite = useCan(USER_PERMISSIONS.invite);
  const canSendLink = useCan(USER_PERMISSIONS.sendPasswordLink);
  const canUpdateStatus = useCan(USER_PERMISSIONS.updateStatus);
  const canDelete = useCan(USER_PERMISSIONS.delete);

  const items = [
    user.status === "INVITED" && canInvite
      ? { action: "resend" as const, label: "Re-send invitation", icon: Send }
      : null,
    user.status === "ACTIVE" && canSendLink
      ? { action: "password-link" as const, label: "Send password link", icon: KeyRound }
      : null,
    user.status === "ACTIVE" && !isSelf && canUpdateStatus
      ? { action: "deactivate" as const, label: "Deactivate", icon: UserX }
      : null,
    user.status === "INACTIVE" && canUpdateStatus
      ? { action: "activate" as const, label: "Activate", icon: UserCheck }
      : null,
  ].filter((item) => item !== null);
  const showDelete = !isSelf && canDelete;

  if (items.length === 0 && !showDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${fullName(user)}`}>
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {items.map(({ action, label, icon: Icon }) => (
          <DropdownMenuItem key={action} onSelect={() => onAction(action, user)}>
            <Icon aria-hidden /> {label}
          </DropdownMenuItem>
        ))}
        {showDelete ? (
          <>
            {items.length > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem variant="destructive" onSelect={() => onAction("delete", user)}>
              <Trash2 aria-hidden /> Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
