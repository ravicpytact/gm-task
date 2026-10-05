"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskTypeInfo } from "@/features/activities";
import { OTHER_CHOICE } from "../constants";
import { useAnswerDrafts } from "../store";
import type { Todo } from "../types";

/**
 * The answer controls of one Todo, chosen by its task type (contract §3). Choosing only marks the
 * answer; nothing is sent until Submit (the list's submit bar), because answers can't be changed.
 * Tapping a chosen option again unchoses it.
 */
export function TodoAnswer({ todo, type }: { todo: Todo; type: TaskTypeInfo | undefined }) {
  const draft = useAnswerDrafts((s) => s.drafts[todo.id]);
  const error = useAnswerDrafts((s) => s.errors[todo.id]);
  const setDraft = useAnswerDrafts((s) => s.setDraft);
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  const name = todo.task.name;

  if (!type) return <Skeleton className="h-9 w-full" aria-label="Loading the answers" />;

  const choice = draft?.choice ?? null;
  const text = draft?.text ?? "";
  const choose = (value: string) =>
    setDraft(
      todo.id,
      value === choice
        ? null
        : { taskType: todo.task.type, choice: value, text: value === OTHER_CHOICE ? text : "" },
    );
  const typeText = (value: string) =>
    setDraft(todo.id, { taskType: todo.task.type, choice, text: value });

  const showInput = type.accepts_time || choice === OTHER_CHOICE;
  const errorText = error ? (
    <p id={errorId} role="alert" className="text-sm text-destructive">
      {error}
    </p>
  ) : null;

  const input = showInput ? (
    <div className="flex flex-col gap-1.5">
      <Input
        id={inputId}
        type={type.accepts_time ? "time" : "text"}
        inputMode={type.accepts_time ? undefined : "numeric"}
        value={text}
        onChange={(e) => typeText(e.target.value)}
        aria-label={type.accepts_time ? `Time for ${name}` : `Other number for ${name}`}
        aria-invalid={Boolean(error)}
        aria-describedby={[type.accepts_time ? null : helpId, error ? errorId : null]
          .filter(Boolean)
          .join(" ")}
        className="w-36"
      />
      {type.accepts_time ? null : (
        <p id={helpId} className="type-caption">
          Whole number, 5 or more
        </p>
      )}
      {errorText}
    </div>
  ) : null;

  if (type.accepts_time) return input;

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label={`Answer ${name}`} className="flex flex-wrap gap-2">
        {type.options.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={choice === option.value ? "default" : "outline"}
            aria-pressed={choice === option.value}
            onClick={() => choose(option.value)}
            className="min-w-11"
          >
            {option.label}
          </Button>
        ))}
        {type.has_other ? (
          <Button
            type="button"
            size="sm"
            variant={choice === OTHER_CHOICE ? "default" : "outline"}
            aria-pressed={choice === OTHER_CHOICE}
            aria-expanded={choice === OTHER_CHOICE}
            onClick={() => choose(OTHER_CHOICE)}
          >
            Other
          </Button>
        ) : null}
      </div>
      {input ?? errorText}
    </div>
  );
}
