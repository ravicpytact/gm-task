"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { applyFieldErrors, toUserMessage } from "@/lib/api";
import { Notice } from "@/components/feedback/notice";
import { FormField, controlAria } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAssignTask } from "../queries";
import { assignSchema, type AssignValues } from "../schemas";
import type { AssignResult } from "../types";
import { assignResultText, nextDueText, todayIso } from "../utils";
import { DueDatesPreview, FrequencySelect, WeekdayToggle } from "./schedule-inputs";
import { TaskPicker } from "@/features/activities";
import { UserPicker } from "@/features/users";

/** Screen 20 — Assign Task: one task to one, several or all active users (contract §7). */
export function AssignTaskDialog({ onClose }: { onClose: () => void }) {
  const [result, setResult] = useState<AssignResult | null>(null);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Assign task</DialogTitle>
          <DialogDescription>
            {result
              ? "The assignment is saved."
              : "Users get a Todo for this task on each due day."}
          </DialogDescription>
        </DialogHeader>
        {result ? (
          <AssignResultView result={result} onDone={onClose} />
        ) : (
          <AssignForm onAssigned={setResult} onCancel={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssignForm({
  onAssigned,
  onCancel,
}: {
  onAssigned: (result: AssignResult) => void;
  onCancel: () => void;
}) {
  const [today] = useState(todayIso);
  const assign = useAssignTask();
  const [formError, setFormError] = useState<string | null>(null);
  const allUsersId = useId();
  const form = useForm<AssignValues>({
    resolver: zodResolver(assignSchema(today)),
    defaultValues: {
      task_id: "",
      all_users: false,
      user_ids: [],
      weekdays: [],
      start_date: today,
      end_date: "",
    },
  });
  const [allUsers, frequency, weekdays, startDate, endDate] = useWatch({
    control: form.control,
    name: ["all_users", "frequency", "weekdays", "start_date", "end_date"],
  });

  const onSubmit = form.handleSubmit((v) => {
    if (!v.frequency) return; // the schema requires it; this tells TypeScript
    setFormError(null);
    assign.mutate(
      {
        task_id: v.task_id,
        all_users: v.all_users,
        user_ids: v.all_users ? null : v.user_ids,
        frequency: v.frequency,
        weekdays: v.frequency === "WEEKLY" ? v.weekdays : [],
        start_date: v.start_date,
        end_date: v.end_date || null,
      },
      {
        onSuccess: (result) => onAssigned(result),
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
          name="task_id"
          label="Task"
          render={(f) => (
            <TaskPicker
              {...controlAria(f)}
              activeOnly
              placeholder="Choose a task"
              value={f.value || null}
              onChange={(id) => f.onChange(id ?? "")}
            />
          )}
        />

        <div className="flex flex-col gap-3">
          <FormField
            control={form.control}
            name="user_ids"
            label="Users"
            render={(f) => (
              <UserPicker
                {...controlAria(f)}
                multiple
                activeOnly
                placeholder={allUsers ? "All active users" : "Choose users"}
                disabled={allUsers}
                value={allUsers ? [] : f.value}
                onChange={f.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="all_users"
            render={({ field }) => (
              <Field orientation="horizontal">
                <Checkbox
                  id={allUsersId}
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked === true);
                    form.clearErrors("user_ids");
                  }}
                />
                <FieldLabel htmlFor={allUsersId} className="font-normal">
                  All active users
                </FieldLabel>
              </Field>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="frequency"
          label="Frequency"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            label="Start date"
            render={(field) => <Input {...field} type="date" min={today} />}
          />
          <FormField
            control={form.control}
            name="end_date"
            label="End date (optional)"
            render={(field) => <Input {...field} type="date" min={startDate || today} />}
          />
        </div>
        <DueDatesPreview
          frequency={frequency}
          weekdays={weekdays}
          startDate={startDate}
          endDate={endDate}
          today={today}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={assign.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={assign.isPending}>
          {assign.isPending ? "Assigning…" : "Assign"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function AssignResultView({ result, onDone }: { result: AssignResult; onDone: () => void }) {
  const single = result.created.length === 1 ? result.created[0] : undefined;
  return (
    <div className="flex flex-col gap-5">
      <Notice tone={result.created.length > 0 ? "success" : "info"}>
        <p>{assignResultText(result)}</p>
        {single ? <p className="mt-1">{nextDueText(single.next_due_dates)}</p> : null}
      </Notice>
      <DialogFooter>
        <Button onClick={onDone}>Done</Button>
      </DialogFooter>
    </div>
  );
}
