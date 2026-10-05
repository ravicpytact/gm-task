"use client";

import { Lock } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useMemo } from "react";
import { toUserMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { DataTable, type DataColumn } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { FilterSelect } from "@/components/data-table/filter-select";
import { SearchInput } from "@/components/data-table/search-input";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTaskTypes } from "@/features/activities";
import { FREQUENCIES, FREQUENCY_LABELS, todoListParsers } from "../constants";
import { useMyTodos } from "../queries";
import type { Frequency, Todo } from "../types";
import { toTodoListQuery } from "../utils";
import { TodoAnswer } from "./todo-answer";
import { SubmitAnswersBar } from "./submit-answers-bar";
import { TodoCard } from "./todo-card";

/**
 * Todos for a Date (contract §2): the signed-in person's pending Todos for one day, answered inline.
 * `date` is the day shown, as the server resolved it (the URL may leave it out for today).
 */
export function TodoList({ date }: { date: string | undefined }) {
  const [params, setParams] = useQueryStates(todoListParsers);
  const todos = useMyTodos(toTodoListQuery(params));
  const types = useTaskTypes().data?.items;
  const typeOf = (type: string) => types?.find((t) => t.type === type);
  // Wide screens: a table with the answer controls in the row; phones: one card per Todo.
  const columns = useMemo<DataColumn<Todo>[]>(
    () => [
      {
        id: "task",
        header: "Task",
        className: "w-2/5 whitespace-normal",
        cell: (t) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium">{t.task.name}</span>
            {t.task.description ? (
              <span className="line-clamp-1 type-caption" title={t.task.description}>
                {t.task.description}
              </span>
            ) : null}
          </span>
        ),
      },
      {
        id: "frequency",
        header: "Frequency",
        cell: (t) => (
          <Badge variant="secondary">
            {FREQUENCY_LABELS[t.frequency as Frequency] ?? t.frequency}
          </Badge>
        ),
      },
      {
        id: "answer",
        header: "Answer",
        className: "whitespace-normal",
        cell: (t) => <TodoAnswer todo={t} type={types?.find((x) => x.type === t.task.type)} />,
      },
    ],
    [types],
  );
  const filtered = Boolean(params.search || params.frequency);
  const day = date ? formatDate(date) : null;

  return (
    <section
      aria-labelledby="todo-list-title"
      data-tour="todo-list"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h2 id="todo-list-title" className="type-section-title">
          {day ? `Pending for ${day}` : "Pending"}
        </h2>
        <p className="flex items-center gap-1.5 type-caption">
          <Lock className="size-3.5" aria-hidden />
          Choose your answers, then Submit. Answers can&apos;t be changed afterwards.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={params.search}
          onSearch={(search) => void setParams({ search, page: 1 })}
          label="Search tasks"
          placeholder="Search tasks"
        />
        <FilterSelect
          label="Frequency"
          value={params.frequency}
          options={FREQUENCIES.map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }))}
          onChange={(frequency) =>
            void setParams({ frequency: frequency as Frequency | null, page: 1 })
          }
        />
      </div>

      {todos.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading Todos">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : todos.isError ? (
        <ErrorState message={toUserMessage(todos.error)} onRetry={() => void todos.refetch()} />
      ) : todos.data.items.length === 0 ? (
        filtered ? (
          <EmptyState
            title="No pending Todos match your search."
            action={
              <Button
                variant="outline"
                onClick={() => void setParams({ search: "", frequency: null, page: 1 })}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState title={day ? `Nothing pending for ${day}. 🎉` : "Nothing pending. 🎉"} />
        )
      ) : (
        <>
          <DataTable
            caption={day ? `Pending Todos for ${day}` : "Pending Todos"}
            rows={todos.data.items}
            columns={columns}
            getRowId={(t) => t.id}
            renderCard={(t) => <TodoCard todo={t} type={typeOf(t.task.type)} />}
            refreshing={todos.isFetching}
          />
          {todos.data.total_pages > 1 ? (
            <DataTablePagination
              page={todos.data.page}
              pageSize={todos.data.page_size}
              total={todos.data.total}
              totalPages={todos.data.total_pages}
              onPageChange={(page) => void setParams({ page })}
            />
          ) : null}
        </>
      )}
      {/* After the list, so it rests below the last Todo and stays in view while scrolling. */}
      <SubmitAnswersBar />
    </section>
  );
}
