"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { applyFieldErrors, toUserMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Notice } from "@/components/feedback/notice";
import { toast } from "@/components/feedback/toast";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ASSIGNMENT_MESSAGES } from "../constants";
import { useUpdateAssignment } from "../queries";
import { endDateSchema, type EndDateValues } from "../schemas";
import type { Assignment } from "../types";
import { todayIso } from "../utils";
import { AssignmentDialogFrame } from "./assignment-dialog-frame";

/** Screen 22 — Change End Date (contract §8a). Extending an ended assignment restarts it. */
export function ChangeEndDateDialog({
  assignmentId,
  onClose,
}: {
  assignmentId: string;
  onClose: () => void;
}) {
  return (
    <AssignmentDialogFrame assignmentId={assignmentId} title="Change end date" onClose={onClose}>
      {(assignment, etag) => (
        <EndDateForm key={assignment.id} assignment={assignment} etag={etag} onDone={onClose} />
      )}
    </AssignmentDialogFrame>
  );
}

function EndDateForm({
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
  const noEndId = useId();
  const ended = assignment.status !== "ACTIVE";
  // A passed end date can't be kept: the field starts empty for a new one.
  const current = assignment.end_date && assignment.end_date >= today ? assignment.end_date : "";
  const form = useForm<EndDateValues>({
    resolver: zodResolver(endDateSchema(today, assignment.start_date)),
    defaultValues: { no_end_date: !ended && assignment.end_date === null, end_date: current },
  });
  const noEndDate = useWatch({ control: form.control, name: "no_end_date" });
  const minDate = assignment.start_date > today ? assignment.start_date : today;

  const onSubmit = form.handleSubmit((v) => {
    setFormError(null);
    update.mutate(
      { id: assignment.id, etag, body: { end_date: v.no_end_date ? null : v.end_date } },
      {
        onSuccess: () => {
          toast.success("Assignment updated successfully");
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
        <span className="text-muted-foreground">Current end date: </span>
        {assignment.end_date ? formatDate(assignment.end_date) : "None"}
      </p>
      {ended && assignment.ended_on ? (
        <Notice tone="info">
          This assignment ended on {formatDate(assignment.ended_on)}. Extending it makes it active
          again from today; the days in between are not filled in.
        </Notice>
      ) : null}
      <FieldGroup>
        <Controller
          control={form.control}
          name="no_end_date"
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id={noEndId}
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true);
                  form.clearErrors("end_date");
                }}
              />
              <FieldLabel htmlFor={noEndId} className="font-normal">
                No end date
              </FieldLabel>
            </Field>
          )}
        />
        {noEndDate ? null : (
          <FormField
            control={form.control}
            name="end_date"
            label="New end date"
            render={(field) => <Input {...field} type="date" min={minDate} className="sm:w-56" />}
          />
        )}
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={update.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
          {update.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
