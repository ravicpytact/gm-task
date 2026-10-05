import { requirePermission } from "@/lib/auth/server";

// The Task List is for Admins: activities.task.read_all (FE-AUTH-004).
export default async function TasksLayout({ children }: LayoutProps<"/tasks">) {
  await requirePermission("activities.task.read_all");
  return children;
}
