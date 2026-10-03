import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { prefetchSession } from "@/lib/auth/server";
import { AppShell } from "@/components/layout/app-shell";

// Everyone signed in. The session guard lives here, never in pages (FE-AUTH-004).
export default async function SignedInLayout({ children }: { children: React.ReactNode }) {
  const { queryClient } = await prefetchSession();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AppShell>{children}</AppShell>
    </HydrationBoundary>
  );
}
