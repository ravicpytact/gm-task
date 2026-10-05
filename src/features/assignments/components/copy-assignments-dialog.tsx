"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { applyFieldErrors, toUserMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { ErrorState } from "@/components/feedback/error-state";
import { Notice } from "@/components/feedback/notice";
import { FormField, controlAria } from "@/components/form/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAssignmentList, useCopyAssignments } from "../queries";
import { copySchema, type CopyValues } from "../schemas";
import type { CopyResult } from "../types";
import { copyResultText, frequencyText, personName } from "../utils";
import { UserPicker } from "@/features/users";

type Step =
  | { kind: "choose" }
  | { kind: "preview"; values: CopyValues; preview: CopyResult }
  | { kind: "result"; result: CopyResult };

const STEP_DESCRIPTIONS: Record<Step["kind"], string> = {
  choose: "Give other people the same tasks and schedules as one person.",
  preview: "Check what will be copied, then confirm.",
  result: "The copies are saved.",
};

/** Screen 24 — Copy Assignments: choose, preview (a dry run), confirm (contract §10). */
export function CopyAssignmentsDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "choose" });
  // Kept here, so Back shows the people already chosen.
  const [values, setValues] = useState<CopyValues>({ source_user_id: "", target_user_ids: [] });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Copy assignments</DialogTitle>
          <DialogDescription>{STEP_DESCRIPTIONS[step.kind]}</DialogDescription>
        </DialogHeader>
        {step.kind === "choose" ? (
          <ChooseStep
            initial={values}
            onPreview={(v, preview) => {
              setValues(v);
              setStep({ kind: "preview", values: v, preview });
            }}
            onCancel={onClose}
          />
        ) : step.kind === "preview" ? (
          <PreviewStep
            values={step.values}
            preview={step.preview}
            onBack={() => setStep({ kind: "choose" })}
            onCopied={(result) => setStep({ kind: "result", result })}
          />
        ) : (
          <ResultStep result={step.result} onDone={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChooseStep({
  initial,
  onPreview,
  onCancel,
}: {
  initial: CopyValues;
  onPreview: (values: CopyValues, preview: CopyResult) => void;
  onCancel: () => void;
}) {
  const dryRun = useCopyAssignments();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CopyValues>({ resolver: zodResolver(copySchema), defaultValues: initial });
  const source = useWatch({ control: form.control, name: "source_user_id" });

  const onSubmit = form.handleSubmit((v) => {
    setFormError(null);
    dryRun.mutate(
      { source_user_id: v.source_user_id, target_user_ids: v.target_user_ids, dry_run: true },
      {
        onSuccess: (preview) => onPreview(v, preview),
        onError: (error) => {
          if (!applyFieldErrors(error, form.setError)) setFormError(toUserMessage(error));
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError ? <Notice tone="error">{formError}</Notice> : null}
      <FieldGroup>
        <FormField
          control={form.control}
          name="source_user_id"
          label="Copy from"
          render={(f) => (
            <UserPicker
              {...controlAria(f)}
              activeOnly
              placeholder="Choose a person"
              value={f.value || null}
              onChange={(id) => {
                f.onChange(id ?? "");
                // The source can't also be a target.
                const targets = form.getValues("target_user_ids");
                if (id && targets.includes(id)) {
                  form.setValue(
                    "target_user_ids",
                    targets.filter((t) => t !== id),
                  );
                }
              }}
            />
          )}
        />
        <FormField
          control={form.control}
          name="target_user_ids"
          label="Copy to"
          render={(f) => (
            <UserPicker
              {...controlAria(f)}
              multiple
              activeOnly
              exclude={source ? [source] : []}
              placeholder="Choose people"
              value={f.value}
              onChange={f.onChange}
            />
          )}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={dryRun.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={dryRun.isPending}>
          {dryRun.isPending ? "Checking…" : "Preview"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** The source's active assignments page size: one person rarely has more than a few dozen. */
const SOURCE_PAGE_SIZE = 100;

function PreviewStep({
  values,
  preview,
  onBack,
  onCopied,
}: {
  values: CopyValues;
  preview: CopyResult;
  onBack: () => void;
  onCopied: (result: CopyResult) => void;
}) {
  const copy = useCopyAssignments();
  const source = useAssignmentList({
    page: 1,
    page_size: SOURCE_PAGE_SIZE,
    user_id: values.source_user_id,
    status: "ACTIVE",
    sort_by: "task_name",
    sort_order: "asc",
  });

  if (source.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (source.isError) {
    return (
      <ErrorState message={toUserMessage(source.error)} onRetry={() => void source.refetch()} />
    );
  }

  const rows = source.data.items;
  const sourceName = rows[0] ? rows[0].user.first_name : "This person";
  const toCopy = preview.targets.reduce((n, t) => n + t.copied.length, 0);
  const skippedFor = new Map(
    preview.targets.map((t) => [t.user_id, new Set(t.skipped.map((s) => s.task_id))]),
  );

  const confirm = () =>
    copy.mutate(
      {
        source_user_id: values.source_user_id,
        target_user_ids: values.target_user_ids,
        dry_run: false,
      },
      { onSuccess: onCopied },
    );

  return (
    <div className="flex flex-col gap-5">
      {copy.isError ? <Notice tone="error">{toUserMessage(copy.error)}</Notice> : null}
      {rows.length === 0 ? (
        <Notice tone="info">{sourceName} has no active assignments to copy.</Notice>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableCaption className="sr-only">What will be copied to each person</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Start date</TableHead>
                  <TableHead>End date</TableHead>
                  {preview.targets.map((t) => (
                    <TableHead key={t.user_id}>{personName(t)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.task.name}</TableCell>
                    <TableCell>{frequencyText(a.frequency, a.weekdays)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(a.start_date)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {a.end_date ? (
                        formatDate(a.end_date)
                      ) : (
                        <span aria-label="No end date">—</span>
                      )}
                    </TableCell>
                    {preview.targets.map((t) => (
                      <TableCell key={t.user_id} className="whitespace-nowrap">
                        {skippedFor.get(t.user_id)?.has(a.task.id) ? (
                          <span className="text-muted-foreground">Skip — already assigned</span>
                        ) : (
                          <Badge variant="secondary">Copy</Badge>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Notice tone="info">
            Copies keep {sourceName}&apos;s start dates so they fall on the same days. No Todos are
            created for past dates.
          </Notice>
          {toCopy === 0 ? (
            <p className="type-caption">Everyone chosen already has all of these tasks.</p>
          ) : null}
        </>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onBack} disabled={copy.isPending}>
          Back
        </Button>
        <Button onClick={confirm} disabled={copy.isPending || toCopy === 0}>
          {copy.isPending
            ? "Copying…"
            : `Copy ${toCopy} ${toCopy === 1 ? "assignment" : "assignments"}`}
        </Button>
      </DialogFooter>
    </div>
  );
}

function ResultStep({ result, onDone }: { result: CopyResult; onDone: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <Notice tone="success">
        <ul className="flex flex-col gap-1">
          {result.targets.map((t) => (
            <li key={t.user_id}>{copyResultText(t)}</li>
          ))}
        </ul>
      </Notice>
      <DialogFooter>
        <Button onClick={onDone}>Done</Button>
      </DialogFooter>
    </div>
  );
}
