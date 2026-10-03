"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError, applyFieldErrors, toUserMessage } from "@/lib/api";
import { ACCOUNT_INACTIVE, safeNextPath } from "@/lib/auth/constants";
import { Notice, type NoticeTone } from "@/components/feedback/notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSignIn } from "../queries";
import { loginSchema, type LoginValues } from "../schemas";
import { PasswordInput } from "./password-input";

/** Codes about the sign-in as a whole; the backend tags them on `email`, but they are not about it. */
const FORM_LEVEL_CODES = new Set(["INVALID_CREDENTIALS", ACCOUNT_INACTIVE, "RATE_LIMIT_EXCEEDED"]);

export function LoginForm({
  next,
  notice,
}: {
  next: string | null;
  notice: { text: string; tone: NoticeTone } | null;
}) {
  const router = useRouter();
  const signIn = useSignIn();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    signIn.mutate(values, {
      onSuccess: () => router.replace(safeNextPath(next)),
      onError: (error) => {
        const formLevel = error instanceof ApiError && FORM_LEVEL_CODES.has(error.code);
        if (formLevel || !applyFieldErrors(error, form.setError))
          setFormError(toUserMessage(error));
      },
    });
  });

  const busy = signIn.isPending || signIn.isSuccess;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError ? (
        <Notice tone="error">{formError}</Notice>
      ) : notice ? (
        <Notice tone={notice.tone}>{notice.text}</Notice>
      ) : null}
      <FieldGroup>
        <FormField
          control={form.control}
          name="email"
          label="Email"
          render={(field) => (
            <Input {...field} type="email" autoComplete="email" inputMode="email" />
          )}
        />
        <FormField
          control={form.control}
          name="password"
          label="Password"
          render={(field) => <PasswordInput {...field} autoComplete="current-password" />}
        />
      </FieldGroup>
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
