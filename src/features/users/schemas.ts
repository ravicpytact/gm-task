import { z } from "zod";

// Mirrors the backend's validation (docs/04-design/auth + users api_spec); the backend still decides.

const name = (label: string) =>
  z.string().trim().min(1, `Enter the ${label}`).max(100, "At most 100 characters");

export const inviteSchema = z.object({
  first_name: name("first name"),
  last_name: name("last name"),
  email: z.email("Enter a valid email address").max(254, "At most 254 characters"),
  role_id: z.string().min(1, "Choose a role"),
});
export type InviteValues = z.infer<typeof inviteSchema>;

export const profileSchema = z.object({
  first_name: name("first name"),
  last_name: name("last name"),
});
export type ProfileValues = z.infer<typeof profileSchema>;
