import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { AssignmentListScreen } from "@/features/assignments";
import { prefetchAssignmentList } from "@/features/assignments/server";

export const metadata = { title: "Task Assignments" };

export default async function AssignmentsPage({ searchParams }: PageProps<"/assignments">) {
  const queryClient = await prefetchAssignmentList(await searchParams);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AssignmentListScreen />
    </HydrationBoundary>
  );
}
