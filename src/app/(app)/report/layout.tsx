import { requirePermission } from "@/lib/auth/server";

// Everyone has a report: reporting.report.read_own (Admins also read_all) (FE-AUTH-004).
export default async function ReportLayout({ children }: LayoutProps<"/report">) {
  await requirePermission("reporting.report.read_own");
  return children;
}
