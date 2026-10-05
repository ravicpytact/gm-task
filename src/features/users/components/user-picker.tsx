"use client";

import { useState } from "react";
import {
  SearchableSelect,
  type FetchedSelectProps,
  type MultiSelectProps,
  type SingleSelectProps,
} from "@/components/form/searchable-select";
import { PICKER_PAGE_SIZE } from "../constants";
import { useUserList } from "../queries";
import { fullName } from "../utils";

export type UserPickerProps = (
  Omit<SingleSelectProps, FetchedSelectProps> | Omit<MultiSelectProps, FetchedSelectProps>
) & {
  /** Only active people (who can get tasks). Otherwise everyone, except invitations if `hideInvited`. */
  activeOnly?: boolean;
  /** Leave out invited people (they have no Todos): History and Reports filters. */
  hideInvited?: boolean;
  /** Values not to offer (Copy: the source can't be a target). */
  exclude?: string[];
};

/** Choose one or several people, searched on the server (name or email). */
export function UserPicker(props: UserPickerProps) {
  const { activeOnly = false, hideInvited = false, exclude = [] } = props;
  const [search, setSearch] = useState("");
  const users = useUserList({
    page: 1,
    page_size: PICKER_PAGE_SIZE,
    search: search || undefined,
    status: activeOnly ? "ACTIVE" : undefined,
    sort_by: "first_name",
    sort_order: "asc",
  });
  const options = (users.data?.items ?? [])
    .filter((u) => !exclude.includes(u.id) && !(hideInvited && u.status === "INVITED"))
    .map((u) => ({
      value: u.id,
      label: fullName(u),
      hint: u.status === "INACTIVE" ? `${u.email} · Inactive` : u.email,
    }));

  return (
    <SearchableSelect
      {...props}
      options={options}
      onSearch={setSearch}
      loading={users.isFetching}
      searchPlaceholder="Search by name or email"
      emptyText={activeOnly ? "No active users found." : "No users found."}
    />
  );
}
