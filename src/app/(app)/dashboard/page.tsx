import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { prefetchDashboard } from "@/features/assignments/server";
import { DashboardScreen } from "@/features/dashboard";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const queryClient = await prefetchDashboard(await searchParams);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardScreen />
    </HydrationBoundary>
  );
}
