import { requirePermission } from "@/lib/auth/server";

// Everyone may see their own profile: users.profile.read_own (FE-AUTH-004).
export default async function ProfileLayout({ children }: LayoutProps<"/profile">) {
  await requirePermission("users.profile.read_own");
  return children;
}
