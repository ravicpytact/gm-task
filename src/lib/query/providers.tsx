"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { SessionEndedBridge } from "@/lib/auth/client";
import { getQueryClient } from "./query-client";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <NuqsAdapter>
        <SessionEndedBridge />
        {children}
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
