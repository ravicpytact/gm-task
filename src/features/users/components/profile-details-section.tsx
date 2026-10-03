"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { APP_NAME } from "@/config/constants";
import { applyFieldErrors, toUserMessage } from "@/lib/api";
import { useCan } from "@/lib/auth/client";
import { ErrorState } from "@/components/feedback/error-state";
import { toast } from "@/components/feedback/toast";
import { FormField } from "@/components/form/form-field";
import { FormSection } from "@/components/layout/form-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { USER_PERMISSIONS } from "../constants";
import { useMyProfile, useUpdateMyProfile } from "../queries";
import { profileSchema, type ProfileValues } from "../schemas";
import type { User } from "../types";

/** Screen 10 — My Profile, the Details section: name editable; email and role read-only. */
export function ProfileDetailsSection() {
  const profile = useMyProfile();
  return (
    <FormSection
      title="Details"
      description={
        <>
          <p>Your name as others see it in {APP_NAME}.</p>
          <p>Your email and role are managed by an Admin.</p>
        </>
      }
    >
      <Card className="max-w-md md:max-w-none">
        {profile.isPending ? (
          <CardContent
            className="flex flex-col gap-4"
            aria-busy="true"
            aria-label="Loading your profile"
          >
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </CardContent>
        ) : profile.isError ? (
          <CardContent>
            <ErrorState
              message={toUserMessage(profile.error)}
              onRetry={() => void profile.refetch()}
            />
          </CardContent>
        ) : (
          // Keyed by version: after a save (or someone else's), the form starts from the new values.
          <DetailsForm key={profile.data.etag} user={profile.data.data} etag={profile.data.etag} />
        )}
      </Card>
    </FormSection>
  );
}

function DetailsForm({ user, etag }: { user: User; etag: string }) {
  const emailId = useId();
  const roleId = useId();
  const canEdit = useCan(USER_PERMISSIONS.updateOwnProfile);
  const update = useUpdateMyProfile();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: user.first_name, last_name: user.last_name },
  });

  const onSubmit = form.handleSubmit((values) =>
    update.mutate(
      { etag, body: values },
      {
        onSuccess: () => toast.success("Profile updated successfully"),
        onError: (error) => {
          if (!applyFieldErrors(error, form.setError)) toast.error(toUserMessage(error));
        },
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <CardContent>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="first_name"
              label="First name"
              render={(field) => <Input {...field} autoComplete="given-name" readOnly={!canEdit} />}
            />
            <FormField
              control={form.control}
              name="last_name"
              label="Last name"
              render={(field) => (
                <Input {...field} autoComplete="family-name" readOnly={!canEdit} />
              )}
            />
          </div>
          <Field>
            <FieldLabel htmlFor={emailId}>Email</FieldLabel>
            <Input id={emailId} value={user.email} readOnly className="bg-muted" />
          </Field>
          <Field>
            <FieldLabel htmlFor={roleId}>Role</FieldLabel>
            <Input id={roleId} value={user.role.name} readOnly className="bg-muted" />
          </Field>
        </FieldGroup>
      </CardContent>
      {canEdit ? (
        <CardFooter className="mt-5 flex-col items-stretch sm:flex-row sm:justify-end">
          <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </CardFooter>
      ) : null}
    </form>
  );
}
