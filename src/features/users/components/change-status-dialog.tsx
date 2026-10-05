"use client";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { toast } from "@/components/feedback/toast";
import { CHANGED_ELSEWHERE } from "../constants";
import { useChangeUserStatus, useUser } from "../queries";
import type { User } from "../types";
import { fullName } from "../utils";

/** Screen 14 — Deactivate / Activate. Reads the user first: the change must send its version. */
export function ChangeStatusDialog({
  user,
  target,
  onClose,
}: {
  user: User;
  target: "ACTIVE" | "INACTIVE";
  onClose: () => void;
}) {
  const current = useUser(user.id);
  const change = useChangeUserStatus();
  const name = fullName(user);
  const deactivate = target === "INACTIVE";

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={deactivate ? `Deactivate ${name}?` : `Activate ${name}?`}
      description={
        deactivate
          ? `${user.first_name} will be signed out immediately and won't get new Todos. Their tasks and history are kept.`
          : `${user.first_name} can sign in again. Todos restart from today; missed days are not filled in.`
      }
      confirmLabel={deactivate ? "Deactivate" : "Activate"}
      variant={deactivate ? "destructive" : "default"}
      confirmDisabled={!current.data || !current.isFetchedAfterMount}
      errorMessages={CHANGED_ELSEWHERE}
      onConfirm={async () => {
        if (!current.data) return;
        await change.mutateAsync({ id: user.id, etag: current.data.etag, status: target });
        toast.success(deactivate ? `${name} deactivated` : `${name} activated`);
      }}
    />
  );
}
