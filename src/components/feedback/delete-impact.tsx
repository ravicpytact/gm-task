"use client";

import { TriangleAlert } from "lucide-react";
import { useId } from "react";
import { formatNumber } from "@/lib/format";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * What a permanent delete removes, shown before it happens (FE-UI-004): the counts, a red warning,
 * and a field where the person types the item's name to enable Delete. Goes inside ConfirmDialog.
 */
export function DeleteImpact({
  counts,
  warning,
  confirmText,
  typed,
  onTypedChange,
  error,
}: {
  /** null while the counts load. */
  counts: { value: number; label: string }[] | null;
  warning: string;
  /** What must be typed: the user's email, the task's name. */
  confirmText: string;
  typed: string;
  onTypedChange: (value: string) => void;
  /** The counts could not load. */
  error?: string | undefined;
}) {
  const inputId = useId();
  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : counts === null ? (
        <div
          className="flex flex-col gap-2"
          aria-busy="true"
          aria-label="Loading what will be deleted"
        >
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {counts.map(({ value, label }) => (
            <li key={label}>
              <strong>{formatNumber(value)}</strong> {label}
            </li>
          ))}
        </ul>
      )}
      <div
        role="note"
        className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
      >
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>{warning}</p>
      </div>
      <Field>
        <FieldLabel htmlFor={inputId}>
          <span>
            Type <span className="font-semibold">{confirmText}</span> to confirm
          </span>
        </FieldLabel>
        <Input
          id={inputId}
          value={typed}
          onChange={(event) => onTypedChange(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </Field>
    </div>
  );
}

/** Case- and space-insensitive, so "lunch " confirms "Lunch". */
export function confirmationMatches(typed: string, expected: string): boolean {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase();
}
