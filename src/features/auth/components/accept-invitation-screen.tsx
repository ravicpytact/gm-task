"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { APP_NAME } from "@/config/constants";
import { ApiError, applyFieldErrors, toUserMessage } from "@/lib/api";
import { loginPath } from "@/lib/auth/constants";
import { ErrorState } from "@/components/feedback/error-state";
import { Notice } from "@/components/feedback/notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PASSWORD_RULE_HINT } from "../constants";
import { useAcceptInvitation, useInvitation } from "../queries";
import { acceptInvitationSchema, type AcceptInvitationValues } from "../schemas";
import { AuthCard } from "./auth-card";
import { LinkProblem } from "./link-problem";
import { PasswordInput } from "./password-input";

const isDeadLink = (error: unknown) =>
  error instanceof ApiError && error.code === "LINK_INVALID_OR_EXPIRED";

const EXPIRED = (
  <LinkProblem
    message="This invitation link has expired or is no longer valid. Ask your Admin to send a new one."
    action={null}
  />
);

/** Screen 02 — Accept Invitation. The link is checked when the screen opens. */
export function AcceptInvitationScreen({ token }: { token: string | null }) {
  if (!token) return EXPIRED;
  return <AcceptInvitationWithToken token={token} />;
}

function AcceptInvitationWithToken({ token }: { token: string }) {
  const router = useRouter();
  const emailId = useId();
  const invitation = useInvitation(token);
  const accept = useAcceptInvitation();
  const [linkDied, setLinkDied] = useState(false);
  const form = useForm<AcceptInvitationValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { password: "", confirm_password: "" },
  });

  if (invitation.isPending) {
    return (
      <AuthCard title="Welcome">
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Checking your invitation">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </AuthCard>
    );
  }
  if (linkDied || (invitation.isError && isDeadLink(invitation.error))) return EXPIRED;
  if (invitation.isError) {
    return (
      <AuthCard title="Welcome">
        <ErrorState
          message={toUserMessage(invitation.error)}
          onRetry={() => void invitation.refetch()}
        />
      </AuthCard>
    );
  }

  const onSubmit = form.handleSubmit(({ password }) =>
    accept.mutate(
      { token, password },
      {
        onSuccess: () => router.replace(loginPath("account-ready")),
        onError: (error) => {
          if (isDeadLink(error)) setLinkDied(true);
          else applyFieldErrors(error, form.setError);
        },
      },
    ),
  );

  const formError = accept.isError && !isDeadLink(accept.error) && !form.formState.errors.password;

  return (
    <AuthCard
      title={`Welcome, ${invitation.data.first_name}`}
      description={`Set a password to activate your ${APP_NAME} account.`}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {formError ? <Notice tone="error">{toUserMessage(accept.error)}</Notice> : null}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={emailId}>Email</FieldLabel>
            <Input id={emailId} value={invitation.data.email} readOnly className="bg-muted" />
          </Field>
          <FormField
            control={form.control}
            name="password"
            label="Password"
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
        <Button type="submit" size="lg" disabled={accept.isPending || accept.isSuccess}>
          {accept.isPending || accept.isSuccess ? "Activating…" : "Activate account"}
        </Button>
      </form>
    </AuthCard>
  );
}
