"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { isNotFound, toUserMessage } from "@/lib/api";
import { useCan } from "@/lib/auth/client";
import { formatDateTime } from "@/lib/format";
import { ErrorState } from "@/components/feedback/error-state";
import { NotFoundState } from "@/components/feedback/not-found-state";
import { PageSkeleton } from "@/components/feedback/skeletons";
import { CountTiles, DetailHeader, FactList } from "@/components/layout/detail-page";
import { Button } from "@/components/ui/button";
import { USER_PERMISSIONS } from "../constants";
import { useDeletePreview, useUser } from "../queries";
import type { User } from "../types";
import { fullName } from "../utils";
import { PersonName } from "./person-name";
import { useUserActions } from "./user-actions";
import { UserRowActions } from "./user-row-actions";
import { UserStatusBadge } from "./user-status-badge";

const USERS = { label: "Users", href: "/users" };

/**
 * Screen 28 — User Detail (contract §5): the user, their counts and their actions. The rest of the
 * page (Assign task, the Assignments and History tabs) belongs to `assignments`, which renders this
 * and passes them in.
 */
export function UserDetail({
  userId,
  extraActions,
  children,
}: {
  userId: string;
  /** More header actions for this user (Assign task). */
  extraActions?: (user: User) => ReactNode;
  /** The rest of the page, once the user is known. */
  children: (user: User) => ReactNode;
}) {
  const router = useRouter();
  const current = useUser(userId);
  const [leaving, setLeaving] = useState(false);
  const { onAction, dialogs, selfId } = useUserActions({
    onDeleted: () => {
      setLeaving(true); // the user is gone: show nothing of it while the list opens
      router.push(USERS.href);
    },
  });
  const canEdit = useCan(USER_PERMISSIONS.update);
  const canDelete = useCan(USER_PERMISSIONS.delete);
  // The counts come from the delete preview, which needs the delete permission.
  const preview = useDeletePreview(canDelete && !leaving ? userId : null);

  if (leaving || current.isPending) return <PageSkeleton />;
  if (current.isError) {
    return isNotFound(current.error, "user_id") ? (
      <NotFoundState message="This user doesn't exist or was deleted." back={USERS} />
    ) : (
      <ErrorState message={toUserMessage(current.error)} onRetry={() => void current.refetch()} />
    );
  }

  const user = current.data.data;
  const pending = preview.data ? preview.data.todos_total - preview.data.todos_completed : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <DetailHeader
          parent={USERS}
          title={fullName(user)}
          badges={<UserStatusBadge status={user.status} />}
          actions={
            <>
              {canEdit ? (
                <Button variant="outline" onClick={() => onAction("edit", user)}>
                  <Pencil aria-hidden /> Edit
                </Button>
              ) : null}
              {extraActions?.(user)}
              <UserRowActions
                user={user}
                isSelf={user.id === selfId}
                onAction={onAction}
                exclude={["edit"]}
              />
            </>
          }
        />
        <FactList
          facts={[
            { label: "Email", value: user.email },
            { label: "Role", value: user.role.name },
            { label: "Invited on", value: formatDateTime(user.created_at) },
            { label: "Invited by", value: <PersonName userId={user.created_by} /> },
            { label: "Last changed", value: formatDateTime(user.updated_at) },
            { label: "Last changed by", value: <PersonName userId={user.updated_by} /> },
            {
              label: "Welcome tour",
              value: user.tour_completed_at ? formatDateTime(user.tour_completed_at) : "Not yet",
              hidden: user.status === "INVITED",
            },
          ]}
        />
      </div>

      {canDelete ? (
        preview.isError ? (
          <ErrorState
            message={toUserMessage(preview.error)}
            onRetry={() => void preview.refetch()}
          />
        ) : (
          <CountTiles
            counts={
              preview.data
                ? [
                    { label: "Assignments", value: preview.data.assignments },
                    { label: "Todos", value: preview.data.todos_total },
                    { label: "Completed Todos", value: preview.data.todos_completed },
                    { label: "Pending Todos", value: pending },
                  ]
                : null
            }
          />
        )
      ) : null}

      {children(user)}
      {dialogs}
    </div>
  );
}
