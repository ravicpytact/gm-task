"use client";

import { useState, type ReactNode } from "react";
import { toUserMessage } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the item: "Delete Ravi Patel?" */
  title: string;
  /** Names the consequence: "Their tasks, history and reports are deleted forever." */
  description: string;
  /** Repeats the verb: "Delete", never "OK". */
  confirmLabel: string;
  variant?: "destructive" | "default";
  /** Usually a mutation's mutateAsync. The dialog closes only when it succeeds. */
  onConfirm: () => Promise<unknown>;
  /** Extra content between the description and the buttons (impact counts, a typed confirmation). */
  children?: ReactNode;
  /** Keeps the confirm button off: the resource's version is still loading, or a check is unmet. */
  confirmDisabled?: boolean;
};

/** The one confirmation for destructive actions (FE-UI-004). Focus starts on Cancel. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  variant = "destructive",
  onConfirm,
  children,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (pending) return;
    if (!next) setError(null);
    onOpenChange(next);
  };

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (caught) {
      setError(toUserMessage(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          {/* Radix moves initial focus to Cancel in an alert dialog. */}
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant={variant === "destructive" ? "danger" : "default"}
            disabled={pending || confirmDisabled}
            onClick={() => void confirm()}
          >
            {pending ? `${confirmLabel}…` : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
