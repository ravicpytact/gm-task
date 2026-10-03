import { APP_NAME, APP_TAGLINE } from "@/config/constants";
import type { LoginReason } from "@/lib/auth/constants";
import { LOGIN_NOTICES } from "../constants";
import { AuthCard, AuthLink } from "./auth-card";
import { LoginForm } from "./login-form";

function isLoginReason(reason: string | null): reason is LoginReason {
  return reason !== null && reason in LOGIN_NOTICES;
}

/** Screen 01 — Login. */
export function LoginScreen({ next, reason }: { next: string | null; reason: string | null }) {
  const notice = isLoginReason(reason) ? LOGIN_NOTICES[reason] : null;
  return (
    <AuthCard
      title={APP_NAME}
      description={APP_TAGLINE}
      footer={<AuthLink href="/forgot-password">Forgot password?</AuthLink>}
    >
      <LoginForm next={next} notice={notice} />
    </AuthCard>
  );
}
