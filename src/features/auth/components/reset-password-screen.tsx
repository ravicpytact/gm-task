"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError, applyFieldErrors, toUserMessage } from "@/lib/api";
import { loginPath } from "@/lib/auth/constants";
import { ErrorState } from "@/components/feedback/error-state";
import { Notice } from "@/components/feedback/notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { PASSWORD_RULE_HINT } from "../constants";
import { useResetLink, useResetPassword } from "../queries";
import { resetPasswordSchema, type ResetPasswordValues } from "../schemas";
import { AuthCard, AuthLink } from "./auth-card";
import { LinkProblem } from "./link-problem";
import { PasswordInput } from "./password-input";

const isDeadLink = (error: unknown) =>
  error instanceof ApiError && error.code === "LINK_INVALID_OR_EXPIRED";

const EXPIRED = (
  <LinkProblem
    message="This link has expired. Request a new one."
    action={<AuthLink href="/forgot-password">Request a new link</AuthLink>}
  />
);

/** Screen 04 — Reset Password. The link is checked when the screen opens. */
export function ResetPasswordScreen({ token }: { token: string | null }) {
  if (!token) return EXPIRED;
  return <ResetPasswordWithToken token={token} />;
}

function ResetPasswordWithToken({ token }: { token: string }) {
  const router = useRouter();
  const link = useResetLink(token);
  const reset = useResetPassword();
  const [linkDied, setLinkDied] = useState(false);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  if (link.isPending) {
    return (
      <AuthCard title="Set a new password">
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Checking your link">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </AuthCard>
    );
  }
  if (linkDied || (link.isError && isDeadLink(link.error))) return EXPIRED;
  if (link.isError) {
    return (
      <AuthCard title="Set a new password">
        <ErrorState message={toUserMessage(link.error)} onRetry={() => void link.refetch()} />
      </AuthCard>
    );
  }

  const onSubmit = form.handleSubmit(({ new_password }) =>
    reset.mutate(
      { token, new_password },
      {
        onSuccess: () => router.replace(loginPath("password-reset")),
        onError: (error) => {
          if (isDeadLink(error)) setLinkDied(true);
          else applyFieldErrors(error, form.setError);
        },
      },
    ),
  );

  const formError =
    reset.isError && !isDeadLink(reset.error) && !form.formState.errors.new_password;

  return (
    <AuthCard
      title="Set a new password"
      description={`For ${link.data.email}`}
      footer={<p className="type-caption">This link is valid for 1 hour.</p>}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {formError ? <Notice tone="error">{toUserMessage(reset.error)}</Notice> : null}
        <FieldGroup>
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
        <Button type="submit" size="lg" disabled={reset.isPending || reset.isSuccess}>
          {reset.isPending || reset.isSuccess ? "Saving…" : "Save password"}
        </Button>
      </form>
    </AuthCard>
  );
}
