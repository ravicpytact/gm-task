import { z } from "zod";

// Mirrors the backend's validation (docs/04-design/auth/api_spec.md); the backend still decides.
// confirm_password is checked here only and never sent.

/** AUTH-R18: 8–16 characters, at least one letter and one digit. */
const newPassword = z
  .string()
  .min(8, "At least 8 characters")
  .max(16, "At most 16 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one digit");

const email = z.email("Enter a valid email address").max(254, "At most 254 characters");
const confirmPassword = z.string().min(1, "Type the password again");
const MISMATCH = { message: "Passwords don't match", path: ["confirm_password"] };

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(128, "At most 128 characters"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const acceptInvitationSchema = z
  .object({ password: newPassword, confirm_password: confirmPassword })
  .refine((v) => v.password === v.confirm_password, MISMATCH);
export type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;

export const resetPasswordSchema = z
  .object({ new_password: newPassword, confirm_password: confirmPassword })
  .refine((v) => v.new_password === v.confirm_password, MISMATCH);
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password"),
    new_password: newPassword,
    confirm_password: confirmPassword,
  })
  .refine((v) => v.new_password === v.confirm_password, MISMATCH)
  .refine((v) => v.new_password !== v.current_password, {
    message: "Must differ from your current password",
    path: ["new_password"],
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
