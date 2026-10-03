import { requirePermission } from "@/lib/auth/server";

// The User List is for Admins: users.user.read_all (FE-AUTH-004).
export default async function UsersLayout({ children }: LayoutProps<"/users">) {
  await requirePermission("users.user.read_all");
  return children;
}
