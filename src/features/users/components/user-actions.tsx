"use client";

import { useCallback, useState } from "react";
import { toUserMessage } from "@/lib/api";
import { useSession } from "@/lib/auth/client";
import { toast } from "@/components/feedback/toast";
import { useResendInvitation, useSendPasswordLink } from "../queries";
import type { User } from "../types";
import { ChangeStatusDialog } from "./change-status-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import type { UserAction } from "./user-row-actions";

type OpenDialog =
  | { kind: "edit"; user: User }
  | { kind: "status"; user: User; target: "ACTIVE" | "INACTIVE" }
  | { kind: "delete"; user: User }
  | null;

/**
 * The actions on one user (contract §1, Row actions), shared by the User List and User Detail:
 * `onAction` runs one, and `dialogs` renders the one that is open. `onDeleted` runs after a delete
 * succeeds (User Detail goes back to the list).
 */
export function useUserActions({ onDeleted }: { onDeleted?: () => void } = {}) {
  const selfId = useSession().data?.user.id;
  const { mutate: resendInvitation } = useResendInvitation();
  const { mutate: sendPasswordLink } = useSendPasswordLink();
  const [dialog, setDialog] = useState<OpenDialog>(null);

  const onAction = useCallback(
    (action: UserAction, user: User) => {
      switch (action) {
        case "edit":
          setDialog({ kind: "edit", user });
          break;
        case "resend":
          resendInvitation(user.id, {
            onSuccess: () => toast.success(`Invitation sent to ${user.email}`),
            onError: (error) => toast.error(toUserMessage(error)),
          });
          break;
        case "password-link":
          sendPasswordLink(user.id, {
            onSuccess: () => toast.success(`Password link sent to ${user.email}`),
            onError: (error) => toast.error(toUserMessage(error)),
          });
          break;
        case "deactivate":
          setDialog({ kind: "status", user, target: "INACTIVE" });
          break;
        case "activate":
          setDialog({ kind: "status", user, target: "ACTIVE" });
          break;
        case "delete":
          setDialog({ kind: "delete", user });
          break;
      }
    },
    [resendInvitation, sendPasswordLink],
  );

  const close = () => setDialog(null);
  const dialogs = (
    <>
      {dialog?.kind === "edit" ? (
        <EditUserDialog user={dialog.user} isSelf={dialog.user.id === selfId} onClose={close} />
      ) : null}
      {dialog?.kind === "status" ? (
        <ChangeStatusDialog user={dialog.user} target={dialog.target} onClose={close} />
      ) : null}
      {dialog?.kind === "delete" ? (
        <DeleteUserDialog user={dialog.user} onClose={close} onDeleted={onDeleted} />
      ) : null}
    </>
  );

  return { onAction, dialogs, selfId };
}
