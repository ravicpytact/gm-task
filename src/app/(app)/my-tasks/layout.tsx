import { requirePermission } from "@/lib/auth/server";

// My tasks is for Users: assignments.assignment.read_own, which Admins don't have (FE-AUTH-004).
export default async function MyTasksLayout({ children }: LayoutProps<"/my-tasks">) {
  await requirePermission("assignments.assignment.read_own");
  return children;
}
