"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
import { toUserMessage } from "@/lib/api";
import { Can } from "@/lib/auth/client";
import { formatDateTime } from "@/lib/format";
import { DataTable, type DataColumn } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { FilterSelect } from "@/components/data-table/filter-select";
import { SearchInput } from "@/components/data-table/search-input";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { TableSkeleton } from "@/components/feedback/skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, USER_PERMISSIONS, USER_STATUSES, userListParsers } from "../constants";
import { useRoles, useUserList } from "../queries";
import type { RoleCode, User } from "../types";
import { fullName, toUserListQuery, userPath } from "../utils";
import { InviteUserDialog } from "./invite-user-dialog";
import { useUserActions } from "./user-actions";
import { UserCard } from "./user-card";
import { UserRowActions } from "./user-row-actions";
import { UserStatusBadge } from "./user-status-badge";

/** Screen 12 — User List (Admin). */
export function UserListScreen() {
  const [params, setParams] = useQueryStates(userListParsers);
  const query = toUserListQuery(params);
  const list = useUserList(query);
  const roles = useRoles();
  const { onAction, dialogs, selfId } = useUserActions();
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = Boolean(params.search || params.status || params.role);
  const clearFilters = () => void setParams({ search: "", status: null, role: null, page: 1 });

  const columns = useMemo<DataColumn<User>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        sortKey: "first_name",
        cell: (u) => (
          <Link href={userPath(u.id)} className="font-medium hover:underline">
            {fullName(u)}
          </Link>
        ),
      },
      { id: "email", header: "Email", sortKey: "email", cell: (u) => u.email },
      { id: "role", header: "Role", cell: (u) => u.role.name },
      { id: "status", header: "Status", cell: (u) => <UserStatusBadge status={u.status} /> },
      {
        id: "added",
        header: "Added",
        sortKey: "created_at",
        cell: (u) => <span className="whitespace-nowrap">{formatDateTime(u.created_at)}</span>,
      },
      {
        id: "actions",
        header: "Actions",
        hideHeader: true,
        className: "w-12 text-right",
        cell: (u) => <UserRowActions user={u} isSelf={u.id === selfId} onAction={onAction} />,
      },
    ],
    [selfId, onAction],
  );

  return (
    <>
      <PageHeader
        title="Users"
        actions={
          <Can code={USER_PERMISSIONS.invite}>
            <Button onClick={() => setInviteOpen(true)}>
              <Plus aria-hidden /> Invite user
            </Button>
          </Can>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={params.search}
          onSearch={(search) => void setParams({ search, page: 1 })}
          label="Search users"
          placeholder="Search by name or email"
        />
        <FilterSelect
          label="Status"
          value={params.status}
          options={USER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          onChange={(status) =>
            void setParams({ status: status as (typeof USER_STATUSES)[number] | null, page: 1 })
          }
        />
        {roles.data ? (
          <FilterSelect
            label="Role"
            value={params.role}
            options={roles.data.items.map((r) => ({ value: r.code, label: r.name }))}
            onChange={(role) => void setParams({ role: role as RoleCode | null, page: 1 })}
          />
        ) : null}
      </div>

      {list.isPending ? (
        <TableSkeleton rows={8} />
      ) : list.isError ? (
        <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
      ) : list.data.items.length === 0 ? (
        <EmptyState
          title={filtered ? "No users match your search." : "No users yet."}
          action={
            filtered ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <DataTable
            caption="Users"
            rows={list.data.items}
            columns={columns}
            getRowId={(u) => u.id}
            renderCard={(u) => <UserCard user={u} isSelf={u.id === selfId} onAction={onAction} />}
            refreshing={list.isFetching}
            sort={{
              by: params.sort,
              order: params.order,
              onSortChange: (sort, order) =>
                void setParams({ sort: sort as typeof params.sort, order, page: 1 }),
            }}
          />
          <DataTablePagination
            page={list.data.page}
            pageSize={list.data.page_size}
            total={list.data.total}
            totalPages={list.data.total_pages}
            onPageChange={(page) => void setParams({ page })}
          />
        </>
      )}

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      {dialogs}
    </>
  );
}
