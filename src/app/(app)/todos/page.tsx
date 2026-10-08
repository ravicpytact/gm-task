import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { prefetchTodos } from "@/features/assignments/server";
import { TodosScreen } from "@/features/todos";

export const metadata = { title: "Todos" };

export default async function TodosPage({ searchParams }: PageProps<"/todos">) {
  const queryClient = await prefetchTodos(await searchParams);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TodosScreen />
    </HydrationBoundary>
  );
}
