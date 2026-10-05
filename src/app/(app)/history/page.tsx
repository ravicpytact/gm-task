import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { requireSession } from "@/lib/auth/server";
import { HISTORY_PERMISSIONS, HistoryScreen } from "@/features/assignments";
import { prefetchHistory } from "@/features/assignments/server";

export const metadata = { title: "History" };

export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  const session = await requireSession();
  const allUsers = session.permissions.includes(HISTORY_PERMISSIONS.readAll);
  const queryClient = await prefetchHistory(await searchParams, allUsers);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HistoryScreen />
    </HydrationBoundary>
  );
}
