"use client";

import { useState } from "react";
import {
  SearchableSelect,
  type FetchedSelectProps,
  type MultiSelectProps,
  type SingleSelectProps,
} from "@/components/form/searchable-select";
import { PICKER_PAGE_SIZE } from "../constants";
import { useTaskList } from "../queries";

export type TaskPickerProps = (
  Omit<SingleSelectProps, FetchedSelectProps> | Omit<MultiSelectProps, FetchedSelectProps>
) & {
  /** Forms offer only active tasks; filters offer every task. */
  activeOnly?: boolean;
  exclude?: string[];
};

/** Choose a task, searched on the server. Needs `activities.task.read_all` (Admins). */
export function TaskPicker(props: TaskPickerProps) {
  const { activeOnly = false, exclude = [] } = props;
  const [search, setSearch] = useState("");
  const tasks = useTaskList({
    page: 1,
    page_size: PICKER_PAGE_SIZE,
    search: search || undefined,
    status: activeOnly ? "ACTIVE" : undefined,
    sort_by: "name",
    sort_order: "asc",
  });
  const options = (tasks.data?.items ?? [])
    .filter((t) => !exclude.includes(t.id))
    .map((t) => ({ value: t.id, label: t.name }));

  return (
    <SearchableSelect
      {...props}
      options={options}
      onSearch={setSearch}
      loading={tasks.isFetching}
      searchPlaceholder="Search tasks"
      emptyText={activeOnly ? "No active tasks found." : "No tasks found."}
    />
  );
}
