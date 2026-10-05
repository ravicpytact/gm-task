import { requirePermission } from "@/lib/auth/server";

// History is everyone's own: assignments.history.read_own (FE-AUTH-004).
export default async function HistoryLayout({ children }: LayoutProps<"/history">) {
  await requirePermission("assignments.history.read_own");
  return children;
}
