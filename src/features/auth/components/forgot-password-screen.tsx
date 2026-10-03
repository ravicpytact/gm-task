"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { applyFieldErrors, toUserMessage } from "@/lib/api";
import { Notice } from "@/components/feedback/notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequestPasswordReset } from "../queries";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas";
import { AuthCard, AuthLink } from "./auth-card";

/** The same answer whether or not the email exists, so the screen never reveals who has an account. */
const SENT = "If this email exists, a reset link has been sent.";

/** Screen 03 — Forgot Password. */
export function ForgotPasswordScreen() {
  const request = useRequestPasswordReset();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(({ email }) =>
    request.mutate(email, { onError: (error) => applyFieldErrors(error, form.setError) }),
  );

  return (
    <AuthCard
      title="Forgot password?"
      description="Enter your email and we'll send you a reset link."
      footer={<AuthLink href="/login">Back to sign in</AuthLink>}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {request.isSuccess ? <Notice tone="success">{SENT}</Notice> : null}
        {request.isError && !form.formState.errors.email ? (
          <Notice tone="error">{toUserMessage(request.error)}</Notice>
        ) : null}
        <FormField
          control={form.control}
          name="email"
          label="Email"
          render={(field) => (
            <Input {...field} type="email" autoComplete="email" inputMode="email" />
          )}
        />
        <Button type="submit" size="lg" disabled={request.isPending}>
          {request.isPending ? "Sending…" : request.isSuccess ? "Send again" : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  );
}
