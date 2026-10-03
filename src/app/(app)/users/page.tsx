import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { UserListScreen } from "@/features/users";
import { prefetchUserList } from "@/features/users/server";

export const metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: PageProps<"/users">) {
  const queryClient = await prefetchUserList(await searchParams);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserListScreen />
    </HydrationBoundary>
  );
}
