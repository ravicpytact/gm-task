"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { applyFieldErrors, toUserMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Notice } from "@/components/feedback/notice";
import { toast } from "@/components/feedback/toast";
import { FormField, controlAria } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ASSIGNMENT_MESSAGES } from "../constants";
import { useUpdateAssignment } from "../queries";
import { frequencySchema, type FrequencyValues } from "../schemas";
import type { Assignment, Frequency, Weekday } from "../types";
import { frequencyText, nextDueText, todayIso } from "../utils";
import { AssignmentDialogFrame } from "./assignment-dialog-frame";
import { DueDatesPreview, FrequencySelect, WeekdayToggle } from "./schedule-inputs";

/** Screen 21 — Change Frequency (contract §8). */
export function ChangeFrequencyDialog({
  assignmentId,
  onClose,
}: {
  assignmentId: string;
  onClose: () => void;
}) {
  return (
    <AssignmentDialogFrame assignmentId={assignmentId} title="Change frequency" onClose={onClose}>
      {(assignment, etag) => (
        // Keyed by id, never by version: a new version must not remount the form mid-save.
        <FrequencyForm key={assignment.id} assignment={assignment} etag={etag} onDone={onClose} />
      )}
    </AssignmentDialogFrame>
  );
}

function FrequencyForm({
  assignment,
  etag,
  onDone,
}: {
  assignment: Assignment;
  etag: string;
  onDone: () => void;
}) {
  const [today] = useState(todayIso);
  const update = useUpdateAssignment();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<FrequencyValues>({
    resolver: zodResolver(frequencySchema(today)),
    defaultValues: {
      frequency: assignment.frequency as Frequency,
      weekdays: assignment.weekdays as Weekday[],
      start_date: today,
    },
  });
  const [frequency, weekdays, startDate] = useWatch({
    control: form.control,
    name: ["frequency", "weekdays", "start_date"],
  });

  const onSubmit = form.handleSubmit((v) => {
    setFormError(null);
    update.mutate(
      {
        id: assignment.id,
        etag,
        body: {
          frequency: v.frequency,
          weekdays: v.frequency === "WEEKLY" ? v.weekdays : [],
          start_date: v.start_date,
        },
      },
      {
        onSuccess: (result) => {
          toast.success("Assignment updated successfully", {
            description: nextDueText(result.data.next_due_dates),
          });
          onDone();
        },
        onError: (error) => {
          if (!applyFieldErrors(error, form.setError)) {
            setFormError(toUserMessage(error, ASSIGNMENT_MESSAGES));
          }
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError ? <Notice tone="error">{formError}</Notice> : null}
      <p className="text-sm">
        <span className="text-muted-foreground">Current schedule: </span>
        {frequencyText(assignment.frequency, assignment.weekdays)}, from{" "}
        {formatDate(assignment.start_date)}
      </p>
      <Notice tone="warning">
        Today&apos;s pending Todo will be replaced. Completed Todos and past pending Todos are kept.
      </Notice>
      <FieldGroup>
        <FormField
          control={form.control}
          name="frequency"
          label="New frequency"
          render={(f) => (
            <FrequencySelect {...controlAria(f)} value={f.value} onChange={f.onChange} />
          )}
        />
        {frequency === "WEEKLY" ? (
          <FormField
            control={form.control}
            name="weekdays"
            label="On these days"
            render={(f) => (
              <WeekdayToggle {...controlAria(f)} value={f.value} onChange={f.onChange} />
            )}
          />
        ) : null}
        <FormField
          control={form.control}
          name="start_date"
          label="Starting from"
          render={(field) => (
            <Input
              {...field}
              type="date"
              min={today}
              max={assignment.end_date ?? undefined}
              className="sm:w-56"
            />
          )}
        />
        <DueDatesPreview
          frequency={frequency}
          weekdays={weekdays}
          startDate={startDate}
          endDate={assignment.end_date ?? undefined}
          today={today}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={update.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
