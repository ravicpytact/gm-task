import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { TaskListScreen } from "@/features/activities";
import { prefetchTaskList } from "@/features/activities/server";

export const metadata = { title: "Tasks" };

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const queryClient = await prefetchTaskList(await searchParams);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TaskListScreen />
    </HydrationBoundary>
  );
}
