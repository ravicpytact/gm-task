"use client";

import { TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { toUserMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { toast } from "@/components/feedback/toast";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeletePreview, useDeleteUser, useUser } from "../queries";
import type { User } from "../types";
import { fullName } from "../utils";

/**
 * Screen 15 — Delete User. An invited user has no data: a simple confirmation (USR-R12).
 * Anyone else: the impact first (USR-R9), then the Admin types the email to enable Delete.
 */
export function DeleteUserDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const current = useUser(user.id);
  const remove = useDeleteUser();
  const name = fullName(user);
  const invited = (current.data?.data.status ?? user.status) === "INVITED";

  const onConfirm = async () => {
    if (!current.data) return;
    await remove.mutateAsync({ id: user.id, etag: current.data.etag });
    toast.success(invited ? "Invitation deleted" : `${name} deleted`);
  };

  if (invited) {
    return (
      <ConfirmDialog
        open
        onOpenChange={(open) => !open && onClose()}
        title={`Delete invitation for ${name} (${user.email})?`}
        description="The invitation link will stop working."
        confirmLabel="Delete"
        confirmDisabled={!current.data}
        onConfirm={onConfirm}
      />
    );
  }
  return (
    <DeleteWithImpact
      user={user}
      etagReady={!!current.data}
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
  const inputId = useId();
  const preview = useDeletePreview(user.id);
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === user.email.toLowerCase();

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Delete ${fullName(user)}?`}
      description={`${user.email}`}
      confirmLabel="Delete"
      confirmDisabled={!etagReady || !preview.data || !matches}
      onConfirm={onConfirm}
    >
      <div className="flex flex-col gap-4">
        {preview.isPending ? (
          <div
            className="flex flex-col gap-2"
            aria-busy="true"
            aria-label="Loading what will be deleted"
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-56" />
          </div>
        ) : preview.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {toUserMessage(preview.error)}
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <strong>{formatNumber(preview.data.assignments)}</strong> assignments
            </li>
            <li>
              <strong>{formatNumber(preview.data.todos_total)}</strong> Todos will be deleted
            </li>
            <li>
              <strong>{formatNumber(preview.data.todos_completed)}</strong> completed answers
              (history) will be lost
            </li>
          </ul>
        )}
        <div
          role="note"
          className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            This permanently deletes {user.first_name} and all their data. It will also disappear
            from past reports. This cannot be undone.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor={inputId}>
            Type <span className="font-semibold">{user.email}</span> to confirm
          </FieldLabel>
          <Input
            id={inputId}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
      </div>
    </ConfirmDialog>
  );
}
