import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TaskTypeInfo } from "@/features/activities";
import { FREQUENCY_LABELS } from "../constants";
import type { Frequency, Todo } from "../types";
import { TodoAnswer } from "./todo-answer";

/** One pending Todo with its answer controls inline (contract §2–3). */
export function TodoCard({ todo, type }: { todo: Todo; type: TaskTypeInfo | undefined }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{todo.task.name}</h3>
            <Badge variant="secondary">
              {FREQUENCY_LABELS[todo.frequency as Frequency] ?? todo.frequency}
            </Badge>
          </div>
          {todo.task.description ? (
            <p className="truncate type-caption" title={todo.task.description}>
              {todo.task.description}
            </p>
          ) : null}
        </div>
        <TodoAnswer todo={todo} type={type} />
      </CardContent>
    </Card>
  );
}
