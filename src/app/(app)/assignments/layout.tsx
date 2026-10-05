import { requirePermission } from "@/lib/auth/server";

// Task Assignments is for Admins: assignments.assignment.read_all (FE-AUTH-004).
export default async function AssignmentsLayout({ children }: LayoutProps<"/assignments">) {
  await requirePermission("assignments.assignment.read_all");
  return children;
}
