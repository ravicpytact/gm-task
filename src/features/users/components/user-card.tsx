import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import type { User } from "../types";
import { fullName } from "../utils";
import { UserRowActions, type UserAction } from "./user-row-actions";
import { UserStatusBadge } from "./user-status-badge";

/** One user on a small screen: the table's columns as a card (FE-UI-005). */
export function UserCard({
  user,
  isSelf,
  onAction,
}: {
  user: User;
  isSelf: boolean;
  onAction: (action: UserAction, user: User) => void;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate font-medium">{fullName(user)}</p>
          <p className="truncate type-caption">{user.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <UserStatusBadge status={user.status} />
            <span className="type-caption">
              {user.role.name} · Added {formatDate(user.created_at)}
            </span>
          </div>
        </div>
        <UserRowActions user={user} isSelf={isSelf} onAction={onAction} />
      </CardContent>
    </Card>
  );
}
