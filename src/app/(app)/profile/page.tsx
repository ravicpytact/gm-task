import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProfileScreen } from "@/features/users";
import { prefetchMyProfile } from "@/features/users/server";

export const metadata = { title: "My profile" };

export default async function ProfilePage() {
  const queryClient = await prefetchMyProfile();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileScreen />
    </HydrationBoundary>
  );
}
