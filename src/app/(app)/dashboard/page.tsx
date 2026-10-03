import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Dashboard" };

// Placeholder until the dashboard feature exists (development plan 7.2).
export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <EmptyState
        title="Nothing here yet"
        description="The dashboard is the next feature to be built."
      />
    </>
  );
}
