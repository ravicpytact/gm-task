"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { SessionEndedBridge } from "@/lib/auth/client";
import type { Accent } from "@/lib/stores/appearance";
import { AppearanceProvider } from "@/lib/stores/appearance-provider";
import { getQueryClient } from "./query-client";

export function Providers({
  initialAccent,
  children,
}: {
  initialAccent: Accent;
  children: ReactNode;
}) {
  return (
    <AppearanceProvider initialAccent={initialAccent}>
      <QueryClientProvider client={getQueryClient()}>
        <NuqsAdapter>
          <SessionEndedBridge />
          {children}
        </NuqsAdapter>
      </QueryClientProvider>
    </AppearanceProvider>
  );
}
