import type { LoginReason } from "@/lib/auth/constants";

/** Why the login screen is shown (?reason=), worded for the person. */
export const LOGIN_NOTICES: Record<LoginReason, { text: string; tone: "info" | "success" }> = {
  "session-ended": { text: "Your session has ended. Please sign in again.", tone: "info" },
  inactive: { text: "Your account is inactive. Contact the Admin.", tone: "info" },
  unavailable: { text: "The service is unavailable right now. Try again shortly.", tone: "info" },
  "account-ready": { text: "Your account is ready. Sign in to start.", tone: "success" },
  "password-reset": { text: "Password changed. Please sign in.", tone: "success" },
};

export const PASSWORD_RULE_HINT = "8–16 characters, at least one letter and one digit.";

/** Messages for the backend's auth error codes (docs/04-design/auth/ui_data_contract.md). */
export const AUTH_ERROR_MESSAGES = {
  LINK_INVALID_OR_EXPIRED: "This link has expired or is no longer valid.",
  INVALID_CURRENT_PASSWORD: "Current password is incorrect.",
};
