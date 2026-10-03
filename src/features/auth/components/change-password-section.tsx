"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ApiError, applyFieldErrors, toUserMessage } from "@/lib/api";
import { toast } from "@/components/feedback/toast";
import { FormField } from "@/components/form/form-field";
import { FormSection } from "@/components/layout/form-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { AUTH_ERROR_MESSAGES, PASSWORD_RULE_HINT } from "../constants";
import { useChangePassword } from "../queries";
import { changePasswordSchema, type ChangePasswordValues } from "../schemas";
import { PasswordInput } from "./password-input";

const EMPTY: ChangePasswordValues = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

/**
 * Screen 11 — Change Password, as a section of My Profile (the users feature places it).
 * This device stays signed in; every other device is signed out.
 */
export function ChangePasswordSection() {
  const change = useChangePassword();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });

  const onSubmit = form.handleSubmit(({ current_password, new_password }) =>
    change.mutate(
      { current_password, new_password },
      {
        onSuccess: () => {
          toast.success("Password changed successfully");
          form.reset(EMPTY);
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === "INVALID_CURRENT_PASSWORD") {
            form.setError("current_password", {
              type: "server",
              message: AUTH_ERROR_MESSAGES.INVALID_CURRENT_PASSWORD,
            });
          } else if (!applyFieldErrors(error, form.setError)) {
            toast.error(toUserMessage(error));
          }
        },
      },
    ),
  );

  return (
    <FormSection
      title="Password"
      description={
        <>
          {/* The rule itself is under the field, where phones see it too; not repeated here. */}
          <p>Choose a password you don&apos;t use anywhere else.</p>
          <p>Changing it keeps you signed in here and signs you out on your other devices.</p>
        </>
      }
    >
      <Card className="max-w-md md:max-w-none">
        <form onSubmit={onSubmit} noValidate>
          <CardContent>
            <FieldGroup>
              <FormField
                control={form.control}
                name="current_password"
                label="Current password"
                render={(field) => <PasswordInput {...field} autoComplete="current-password" />}
              />
              <FormField
                control={form.control}
                name="new_password"
                label="New password"
                description={PASSWORD_RULE_HINT}
                render={(field) => <PasswordInput {...field} autoComplete="new-password" />}
              />
              <FormField
                control={form.control}
                name="confirm_password"
                label="Confirm password"
                render={(field) => <PasswordInput {...field} autoComplete="new-password" />}
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="mt-5 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between md:justify-end">
            {/* Phones do not show the section's explanation column, so the note stays here. */}
            <p className="type-caption md:hidden">Other devices will be logged out.</p>
            <Button type="submit" disabled={change.isPending}>
              {change.isPending ? "Changing…" : "Change password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </FormSection>
  );
}
