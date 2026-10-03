"use client";

import { CircleAlert, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** What failed, in plain words, and a retry (FE-UI-003). `message` comes from toUserMessage. */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-10 text-center"
    >
      <CircleAlert className="size-8 text-destructive" aria-hidden />
      <p className="max-w-prose text-sm">{message}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RotateCw aria-hidden /> Try again
        </Button>
      ) : null}
    </div>
  );
}
