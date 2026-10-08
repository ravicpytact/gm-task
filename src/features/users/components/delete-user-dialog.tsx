"use client";

import { useState } from "react";
import { toUserMessage } from "@/lib/api";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { confirmationMatches, DeleteImpact } from "@/components/feedback/delete-impact";
import { toast } from "@/components/feedback/toast";
import { CHANGED_ELSEWHERE } from "../constants";
import { useDeletePreview, useDeleteUser, useUser } from "../queries";
import type { User } from "../types";
import { fullName } from "../utils";

/**
 * Screen 15 — Delete User. An invited user has no data: a simple confirmation (USR-R12).
 * Anyone else: the impact first (USR-R9), then the Admin types the email to enable Delete.
 */
export function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: User;
  onClose: () => void;
  /** After a successful delete, before the dialog closes (User Detail leaves the page). */
  onDeleted?: (() => void) | undefined;
}) {
  const current = useUser(user.id);
  const remove = useDeleteUser();
  const name = fullName(user);
  const invited = (current.data?.data.status ?? user.status) === "INVITED";

  const onConfirm = async () => {
    if (!current.data) return;
    await remove.mutateAsync({ id: user.id, etag: current.data.etag });
    toast.success(invited ? "Invitation deleted" : `${name} deleted`);
    onDeleted?.();
  };

  if (invited) {
    return (
      <ConfirmDialog
        open
        onOpenChange={(open) => !open && onClose()}
        title={`Delete invitation for ${name} (${user.email})?`}
        description="The invitation link will stop working."
        confirmLabel="Delete"
        confirmDisabled={!current.data || !current.isFetchedAfterMount}
        errorMessages={CHANGED_ELSEWHERE}
        onConfirm={onConfirm}
      />
    );
  }
  return (
    <DeleteWithImpact
      user={user}
      etagReady={!!current.data && current.isFetchedAfterMount}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}

function DeleteWithImpact({
  user,
  etagReady,
  onConfirm,
  onClose,
}: {
  user: User;
  etagReady: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const preview = useDeletePreview(user.id);
  const [typed, setTyped] = useState("");

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Delete ${fullName(user)}?`}
      description={user.email}
      confirmLabel="Delete"
      confirmDisabled={!etagReady || !preview.data || !confirmationMatches(typed, user.email)}
      errorMessages={CHANGED_ELSEWHERE}
      onConfirm={onConfirm}
    >
      <DeleteImpact
        counts={
          preview.data
            ? [
                { value: preview.data.assignments, label: "assignments" },
                { value: preview.data.todos_total, label: "Todos will be deleted" },
                {
                  value: preview.data.todos_completed,
                  label: "completed answers (history) will be lost",
                },
              ]
            : null
        }
        error={preview.isError ? toUserMessage(preview.error) : undefined}
        warning={`This permanently deletes ${user.first_name} and all their data. It will also disappear from past reports. This cannot be undone.`}
        confirmText={user.email}
        typed={typed}
        onTypedChange={setTyped}
      />
    </ConfirmDialog>
  );
}
