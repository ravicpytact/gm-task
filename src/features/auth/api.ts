import { unwrap, unwrapEmpty, type ApiClient } from "@/lib/api";
import type { AcceptInvitation, ResetPassword } from "./types";

// Public operations of the backend's auth package (no session needed).

export const verifyInvitation = (api: ApiClient, token: string) =>
  unwrap(api.POST("/v1/invitations/verify", { body: { token } }));

export const acceptInvitation = (api: ApiClient, body: AcceptInvitation) =>
  unwrapEmpty(api.POST("/v1/invitations/accept", { body }));

export const requestPasswordReset = (api: ApiClient, email: string) =>
  unwrapEmpty(api.POST("/v1/auth/forgot-password", { body: { email } }));

export const verifyResetLink = (api: ApiClient, token: string) =>
  unwrap(api.POST("/v1/auth/reset-password/verify", { body: { token } }));

export const resetPassword = (api: ApiClient, body: ResetPassword) =>
  unwrapEmpty(api.POST("/v1/auth/reset-password", { body }));
