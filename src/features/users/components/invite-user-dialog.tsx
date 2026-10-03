"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { applyFieldErrors, toUserMessage } from "@/lib/api";
import { ErrorState } from "@/components/feedback/error-state";
import { Notice } from "@/components/feedback/notice";
import { toast } from "@/components/feedback/toast";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useInviteUser, useRoles } from "../queries";
import { inviteSchema, type InviteValues } from "../schemas";
import type { Role } from "../types";

/** Screen 13 — Invite User. */
export function InviteUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const roles = useRoles();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            An invitation link valid for 24 hours will be emailed.
          </DialogDescription>
        </DialogHeader>
        {roles.isPending ? (
          <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading roles">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : roles.isError ? (
          <ErrorState message={toUserMessage(roles.error)} onRetry={() => void roles.refetch()} />
        ) : (
          // Mounted only while open, so every opening starts with an empty form.
          <InviteForm roles={roles.data.items} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function InviteForm({ roles, onDone }: { roles: Role[]; onDone: () => void }) {
  const invite = useInviteUser();
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      role_id: roles.find((role) => role.code === "USER")?.id ?? "",
    },
  });

  const onSubmit = form.handleSubmit((values) =>
    invite.mutate(values, {
      onSuccess: (user) => {
        toast.success(`Invitation sent to ${user.email}`);
        onDone();
      },
      onError: (error) => {
        applyFieldErrors(error, form.setError);
      },
    }),
  );

  const errors = form.formState.errors;
  const showError = invite.isError && !errors.email && !errors.first_name && !errors.last_name;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {showError ? <Notice tone="error">{toUserMessage(invite.error)}</Notice> : null}
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            label="First name"
            render={(field) => <Input {...field} autoComplete="off" />}
          />
          <FormField
            control={form.control}
            name="last_name"
            label="Last name"
            render={(field) => <Input {...field} autoComplete="off" />}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          label="Email"
          render={(field) => <Input {...field} type="email" inputMode="email" autoComplete="off" />}
        />
        <FormField
          control={form.control}
          name="role_id"
          label="Role"
          render={({ value, onChange, onBlur, id, ...aria }) => (
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger id={id} onBlur={onBlur} className="w-full" {...aria}>
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={invite.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={invite.isPending}>
          {invite.isPending ? "Sending…" : "Send invitation"}
        </Button>
      </DialogFooter>
    </form>
  );
}
