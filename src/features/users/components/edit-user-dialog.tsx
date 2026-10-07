"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ApiError, applyFieldErrors, toUserMessage } from "@/lib/api";
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
import { CHANGED_ELSEWHERE } from "../constants";
import { useEditUser, useRoles, useUser } from "../queries";
import { editUserSchema, type EditUserValues } from "../schemas";
import type { Role, User, UserEdit } from "../types";
import { fullName } from "../utils";
import { UserStatusBadge } from "./user-status-badge";

/**
 * Edit User (docs/04-design/users/ui_data_contract.md §1a): first name, last name and role. Email is
 * read-only; status has its own Activate / Deactivate actions. Reads the user when it opens, so the
 * form starts from the latest values and the save sends their version.
 */
export function EditUserDialog({
  user,
  isSelf,
  onClose,
}: {
  user: User;
  /** The signed-in Admin's own row: the role cannot change (USR-R15). */
  isSelf: boolean;
  onClose: () => void;
}) {
  const current = useUser(user.id);
  const roles = useRoles();
  const ready = current.data && current.isFetchedAfterMount && roles.data;
  const failed = current.error ?? roles.error;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        {failed ? (
          <ErrorState
            message={toUserMessage(failed)}
            onRetry={() => void Promise.all([current.refetch(), roles.refetch()])}
          />
        ) : ready ? (
          // Keyed by the user, never by the version: a save changes the ETag (nextjs-forms).
          <EditUserForm
            key={user.id}
            user={current.data.data}
            etag={current.data.etag}
            roles={roles.data.items}
            isSelf={isSelf}
            onDone={onClose}
          />
        ) : (
          <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading user">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const valuesOf = (user: User): EditUserValues => ({
  first_name: user.first_name,
  last_name: user.last_name,
  role_id: user.role.id,
});

function EditUserForm({
  user,
  etag,
  roles,
  isSelf,
  onDone,
}: {
  user: User;
  etag: string;
  roles: Role[];
  isSelf: boolean;
  onDone: () => void;
}) {
  const edit = useEditUser();
  const form = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: valuesOf(user),
  });
  const conflict = edit.error instanceof ApiError && edit.error.status === 412;

  const onSubmit = form.handleSubmit((values) => {
    // PATCH: only what changed (nextjs-forms, Edit form step 3).
    const dirty = form.formState.dirtyFields;
    const body: UserEdit = {
      ...(dirty.first_name ? { first_name: values.first_name } : {}),
      ...(dirty.last_name ? { last_name: values.last_name } : {}),
      ...(dirty.role_id && !isSelf ? { role_id: values.role_id } : {}),
    };
    edit.mutate(
      { id: user.id, etag, body, isSelf },
      {
        onSuccess: (result) => {
          const saved = result.data;
          const roleChanged = saved.role.id !== user.role.id;
          toast.success(
            roleChanged && saved.status === "ACTIVE"
              ? `${fullName(saved)} is now ${saved.role.name}. They'll get an email.`
              : "User updated successfully",
          );
          form.reset(valuesOf(saved));
          onDone();
        },
        onError: (error) => {
          // A 412 is about the whole form; business rules (own role, last Active Admin) name a field.
          if (!(error instanceof ApiError && error.status === 412))
            applyFieldErrors(error, form.setError);
        },
      },
    );
  });

  const errors = form.formState.errors;
  const showError = edit.isError && !errors.first_name && !errors.last_name && !errors.role_id;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {showError ? (
        <Notice tone="error">
          {toUserMessage(edit.error, CHANGED_ELSEWHERE)}
          {conflict ? (
            <Button
              type="button"
              variant="link"
              className="h-auto px-1 py-0"
              onClick={() => {
                // The latest version has been fetched (the mutation invalidates it on a 412).
                form.reset(valuesOf(user));
                edit.reset();
              }}
            >
              Load the latest
            </Button>
          ) : null}
        </Notice>
      ) : null}
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
          name="role_id"
          label="Role"
          description={
            isSelf
              ? "You can't change your own role."
              : "A new role applies right away. The user stays signed in."
          }
          render={({ value, onChange, onBlur, id, ...aria }) => (
            <Select value={value} onValueChange={onChange} disabled={isSelf}>
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
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status</span>
          <UserStatusBadge status={user.status} />
        </div>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={edit.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={edit.isPending || !form.formState.isDirty}>
          {edit.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
