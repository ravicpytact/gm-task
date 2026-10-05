"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info, TriangleAlert } from "lucide-react";
import { useId } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ApiError, applyFieldErrors, toUserMessage } from "@/lib/api";
import { ErrorState } from "@/components/feedback/error-state";
import { Notice } from "@/components/feedback/notice";
import { toast } from "@/components/feedback/toast";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DESCRIPTION_MAX, TASK_MESSAGES } from "../constants";
import { useCreateTask, useTask, useTaskTypes, useUpdateTask } from "../queries";
import {
  createTaskSchema,
  editTaskSchema,
  type CreateTaskValues,
  type EditTaskValues,
} from "../schemas";
import type { Task, TaskTypeInfo } from "../types";
import { answerPreview, typeLabel } from "../utils";

/** Screen 17 — Create Task (no `taskId`) or Edit Task. */
export function TaskFormDialog({
  taskId,
  onClose,
}: {
  /** null: create a task. */
  taskId: string | null;
  onClose: () => void;
}) {
  const types = useTaskTypes();
  const editing = taskId !== null;
  const task = useTask(taskId);
  // Editing waits for a fresh read: the save sends the version it saw.
  const loading = types.isPending || (editing && (task.isPending || !task.isFetchedAfterMount));
  const failed = types.isError ? types.error : editing && task.isError ? task.error : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit task" : "Create task"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Renaming changes the name everywhere, including past history and reports."
              : "Something users track every day, like Pull-ups or Lunch."}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : failed ? (
          <ErrorState
            message={toUserMessage(failed)}
            onRetry={() => void (types.isError ? types.refetch() : task.refetch())}
          />
        ) : editing && task.data ? (
          <EditForm
            key={task.data.data.id}
            task={task.data.data}
            etag={task.data.etag}
            types={types.data?.items ?? []}
            onDone={onClose}
          />
        ) : (
          <CreateForm types={types.data?.items ?? []} onDone={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** The contract's words when the name is taken; the backend may not tag it on a field. */
function duplicateName(error: unknown): string | null {
  return error instanceof ApiError && error.code === "DUPLICATE_TASK_NAME"
    ? TASK_MESSAGES.DUPLICATE_TASK_NAME
    : null;
}

function CreateForm({ types, onDone }: { types: TaskTypeInfo[]; onDone: () => void }) {
  const create = useCreateTask();
  const legendId = useId();
  const form = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { name: "", description: "" },
  });
  const selectedType = useWatch({ control: form.control, name: "type" });
  const selected = types.find((t) => t.type === selectedType);
  const descriptionLength = useWatch({ control: form.control, name: "description" }).length;

  const onSubmit = form.handleSubmit(({ name, description, type }) =>
    create.mutate(
      { name, type, description: description.trim() || null },
      {
        onSuccess: () => {
          toast.success("Task created successfully");
          onDone();
        },
        onError: (error) => {
          const taken = duplicateName(error);
          if (taken) form.setError("name", { type: "server", message: taken });
          else applyFieldErrors(error, form.setError);
        },
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {create.isError && !form.formState.errors.name ? (
        <Notice tone="error">{toUserMessage(create.error)}</Notice>
      ) : null}
      <FieldGroup>
        <FormField
          control={form.control}
          name="name"
          label="Name"
          render={(field) => <Input {...field} autoComplete="off" />}
        />
        <FormField
          control={form.control}
          name="description"
          label="Description (optional)"
          description={`${descriptionLength}/${DESCRIPTION_MAX}`}
          render={(field) => <Textarea {...field} rows={3} maxLength={DESCRIPTION_MAX} />}
        />
        <Controller
          control={form.control}
          name="type"
          render={({ field, fieldState }) => (
            <FieldSet data-invalid={fieldState.invalid}>
              <FieldLegend id={legendId} variant="label">
                Type
              </FieldLegend>
              <RadioGroup
                value={field.value ?? ""}
                onValueChange={field.onChange}
                aria-labelledby={legendId}
                aria-invalid={fieldState.invalid}
                className="grid grid-cols-2 gap-3 sm:grid-cols-4"
              >
                {types.map((t) => (
                  <FieldLabel key={t.type} htmlFor={`${legendId}-${t.type}`}>
                    <Field orientation="horizontal">
                      <RadioGroupItem value={t.type} id={`${legendId}-${t.type}`} />
                      <FieldContent>
                        <FieldTitle>{t.label}</FieldTitle>
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
              {selected ? (
                <p className="flex gap-2 rounded-lg bg-muted p-3 text-sm" aria-live="polite">
                  <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span>
                    Users will answer: <strong>{answerPreview(selected)}</strong>
                  </span>
                </p>
              ) : null}
              <p className="flex items-center gap-2 type-caption">
                <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
                The type can&apos;t be changed later.
              </p>
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={create.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create task"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditForm({
  task,
  etag,
  types,
  onDone,
}: {
  task: Task;
  etag: string;
  types: TaskTypeInfo[];
  onDone: () => void;
}) {
  const update = useUpdateTask();
  const typeId = useId();
  const form = useForm<EditTaskValues>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: { name: task.name, description: task.description ?? "" },
  });
  const descriptionLength = useWatch({ control: form.control, name: "description" }).length;

  const onSubmit = form.handleSubmit(({ name, description }) => {
    const dirty = form.formState.dirtyFields;
    update.mutate(
      {
        id: task.id,
        etag,
        // Only what changed (PATCH); an emptied description clears it.
        body: {
          name: dirty.name ? name : undefined,
          description: dirty.description ? description.trim() || null : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Task updated successfully");
          onDone();
        },
        onError: (error) => {
          const taken = duplicateName(error);
          if (taken) form.setError("name", { type: "server", message: taken });
          else applyFieldErrors(error, form.setError);
        },
      },
    );
  });

  const showError = update.isError && !form.formState.errors.name;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {showError ? (
        <Notice tone="error">{toUserMessage(update.error, TASK_MESSAGES)}</Notice>
      ) : null}
      <FieldGroup>
        <FormField
          control={form.control}
          name="name"
          label="Name"
          render={(field) => <Input {...field} autoComplete="off" />}
        />
        <FormField
          control={form.control}
          name="description"
          label="Description (optional)"
          description={`${descriptionLength}/${DESCRIPTION_MAX}`}
          render={(field) => <Textarea {...field} rows={3} maxLength={DESCRIPTION_MAX} />}
        />
        <Field>
          <FieldLabel htmlFor={typeId}>Type</FieldLabel>
          <Input id={typeId} value={typeLabel(task.type, types)} readOnly className="bg-muted" />
        </Field>
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
