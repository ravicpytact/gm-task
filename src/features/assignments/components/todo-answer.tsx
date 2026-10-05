"use client";

import { useId, useState } from "react";
import { ApiError, toUserMessage } from "@/lib/api";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskTypeInfo } from "@/features/activities";
import { TODO_MESSAGES } from "../constants";
import { useAnswerTodo } from "../queries";
import { otherAnswerSchema, timeAnswerSchema } from "../schemas";
import type { Todo } from "../types";

const OTHER = "__other__";

/**
 * The answer controls of one Todo, chosen by its task type (contract §3). A choice button answers at
 * once; Time and Other take a value and Save. Answers can't be changed afterwards.
 */
export function TodoAnswer({ todo, type }: { todo: Todo; type: TaskTypeInfo | undefined }) {
  const answer = useAnswerTodo();
  const [chosen, setChosen] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  const name = todo.task.name;

  if (!type) return <Skeleton className="h-9 w-full" aria-label="Loading the answers" />;

  const send = (responseValue: string, isOther = false) => {
    setError(null);
    // mutateAsync, not mutate's callbacks: the card leaves the list (unmounts) as soon as the answer
    // is saved, and React Query drops per-call callbacks of an unmounted component.
    answer
      .mutateAsync({ id: todo.id, body: { response_value: responseValue, is_other: isOther } })
      .then(
        () => toast.success("Todo updated successfully"),
        (e: unknown) => {
          const message = toUserMessage(e, TODO_MESSAGES);
          // Already answered or gone: the card has left the list, so say it in a toast.
          if (e instanceof ApiError && (e.status === 409 || e.status === 404)) toast.error(message);
          else setError(message);
        },
      );
  };

  const saveValue = () => {
    const parsed = (type.accepts_time ? timeAnswerSchema : otherAnswerSchema).safeParse(value);
    if (!parsed.success) setError(parsed.error.issues[0]?.message ?? null);
    else send(parsed.data, !type.accepts_time);
  };

  const busy = answer.isPending;
  const showValueInput = type.accepts_time || chosen === OTHER;
  const errorText = error ? (
    <p id={errorId} role="alert" className="text-sm text-destructive">
      {error}
    </p>
  ) : null;

  const valueInput = showValueInput ? (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          type={type.accepts_time ? "time" : "text"}
          inputMode={type.accepts_time ? undefined : "numeric"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              saveValue();
            }
          }}
          aria-label={type.accepts_time ? `Time for ${name}` : `Other number for ${name}`}
          aria-invalid={Boolean(error)}
          aria-describedby={[type.accepts_time ? null : helpId, error ? errorId : null]
            .filter(Boolean)
            .join(" ")}
          disabled={busy}
          className="w-36"
        />
        <Button type="button" onClick={saveValue} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
      {type.accepts_time ? null : (
        <p id={helpId} className="type-caption">
          Whole number, 5 or more
        </p>
      )}
      {errorText}
    </div>
  ) : null;

  if (type.accepts_time) return valueInput;

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label={`Answer ${name}`} className="flex flex-wrap gap-2">
        {type.options.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={chosen === option.value ? "default" : "outline"}
            aria-pressed={chosen === option.value}
            disabled={busy}
            onClick={() => {
              setChosen(option.value);
              send(option.value);
            }}
            className="min-w-11"
          >
            {option.label}
          </Button>
        ))}
        {type.has_other ? (
          <Button
            type="button"
            size="sm"
            variant={chosen === OTHER ? "default" : "outline"}
            aria-pressed={chosen === OTHER}
            aria-expanded={chosen === OTHER}
            disabled={busy}
            onClick={() => {
              setError(null);
              setChosen(chosen === OTHER ? null : OTHER);
            }}
          >
            Other
          </Button>
        ) : null}
      </div>
      {valueInput ?? errorText}
    </div>
  );
}
