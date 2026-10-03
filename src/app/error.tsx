"use client";

import { ErrorState } from "@/components/feedback/error-state";

// The framework requires error boundaries to be client components (FE-BOUND-001 exception).
export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <ErrorState message="Something went wrong while showing this page." onRetry={reset} />
      </div>
    </main>
  );
}
