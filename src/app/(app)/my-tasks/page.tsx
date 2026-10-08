import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { MyTasksScreen } from "@/features/assignments";
import { prefetchMyTasks } from "@/features/assignments/server";

export const metadata = { title: "My tasks" };

export default async function MyTasksPage({ searchParams }: PageProps<"/my-tasks">) {
  const queryClient = await prefetchMyTasks(await searchParams);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MyTasksScreen />
    </HydrationBoundary>
  );
}
