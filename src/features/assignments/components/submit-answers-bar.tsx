"use client";

import { Lock } from "lucide-react";
import { useEffect } from "react";
import { toUserMessage } from "@/lib/api";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { useTaskTypes } from "@/features/activities";
import { TODO_MESSAGES } from "../constants";
import { useAnswerTodos } from "../queries";
import { useAnswerDrafts } from "../store";
import type { TodoAnswer } from "../types";
import { draftAnswer } from "../utils";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The bar that sends the chosen answers (contract §3). Only Todos with a complete answer are sent;
 * a value that breaks the rules stops Submit and is shown on its row. Stays at the bottom of the
 * screen while answers are chosen.
 */
export function SubmitAnswersBar() {
  const drafts = useAnswerDrafts((s) => s.drafts);
  const setErrors = useAnswerDrafts((s) => s.setErrors);
  const clear = useAnswerDrafts((s) => s.clear);
  const types = useTaskTypes().data?.items;
  const submit = useAnswerTodos();

  // Every chosen answer counts, on this day and page or another (drafts survive both).
  const ready: { id: string; body: TodoAnswer }[] = [];
  const invalid: { id: string; message: string }[] = [];
  for (const [id, draft] of Object.entries(drafts)) {
    const result = draftAnswer(
      draft,
      types?.find((t) => t.type === draft.taskType),
    );
    if (result.state === "ready") ready.push({ id, body: result.body });
    if (result.state === "invalid") invalid.push({ id, message: result.message });
  }
  const count = ready.length + invalid.length;

  // Closing or reloading the tab would lose the chosen answers: ask first.
  useEffect(() => {
    if (count === 0) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [count]);

  if (count === 0) return null;

  const onSubmit = async () => {
    if (invalid.length > 0) {
      setErrors(Object.fromEntries(invalid.map((c) => [c.id, c.message])));
      toast.error(`Check ${plural(invalid.length, "answer", "answers")} before submitting.`);
      return;
    }
    const outcomes = await submit.mutateAsync(ready);
    const saved = outcomes.filter((o) => o.result === "saved");
    const gone = outcomes.filter((o) => o.result === "gone");
    const failed = outcomes.filter((o) => o.result === "failed");
    clear([...saved, ...gone].map((o) => o.id));
    setErrors(
      Object.fromEntries(
        failed.map((o) => [
          o.id,
          o.result === "failed" ? toUserMessage(o.error, TODO_MESSAGES) : "",
        ]),
      ),
    );
    if (saved.length) toast.success(`${plural(saved.length, "answer", "answers")} saved`);
    if (gone.length) {
      toast.error(
        gone.length === 1
          ? TODO_MESSAGES.TODO_ALREADY_COMPLETED
          : `${gone.length} Todos were already answered.`,
      );
    }
    if (failed.length)
      toast.error(`${plural(failed.length, "answer was", "answers were")} not saved.`);
  };

  return (
    <div
      role="region"
      aria-label="Submit answers"
      className="sticky bottom-20 z-10 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-raised sm:flex-row sm:items-center sm:justify-between md:bottom-4"
    >
      <div className="flex flex-col gap-0.5">
        <p className="font-medium" aria-live="polite">
          {plural(count, "answer", "answers")} ready
        </p>
        <p className="flex items-center gap-1.5 type-caption">
          <Lock className="size-3.5" aria-hidden />
          Answers can&apos;t be changed after submitting.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={() => clear()}
          disabled={submit.isPending}
          className="flex-1 sm:flex-none"
        >
          Clear
        </Button>
        <Button
          onClick={() => void onSubmit()}
          disabled={submit.isPending}
          className="flex-1 sm:flex-none"
        >
          {submit.isPending ? "Submitting…" : `Submit ${count}`}
        </Button>
      </div>
    </div>
  );
}
