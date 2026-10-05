import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { requireSession } from "@/lib/auth/server";
import { REPORT_PERMISSIONS, ReportScreen } from "@/features/reporting";
import { prefetchReport } from "@/features/reporting/server";

export const metadata = { title: "Report" };

export default async function ReportPage({ searchParams }: PageProps<"/report">) {
  const session = await requireSession();
  const allUsers = session.permissions.includes(REPORT_PERMISSIONS.readAll);
  const queryClient = await prefetchReport(await searchParams, allUsers);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReportScreen />
    </HydrationBoundary>
  );
}
