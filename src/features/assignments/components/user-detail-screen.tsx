"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useCan } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { fullName, UserDetail, type User } from "@/features/users";
import { ASSIGNMENT_PERMISSIONS } from "../constants";
import { AssignTaskDialog } from "./assign-task-dialog";
import { DetailTabs } from "./detail-tabs";

/**
 * Screen 28 — User Detail (Admin; users contract §5): the user from `users`, plus Assign task with
 * this user already chosen, and their Assignments and History tabs.
 */
export function UserDetailScreen({ userId }: { userId: string }) {
  const canAssign = useCan(ASSIGNMENT_PERMISSIONS.create);
  const [assigning, setAssigning] = useState<User | null>(null);

  return (
    <>
      <UserDetail
        userId={userId}
        extraActions={(user) =>
          // Only active people can be given tasks (contract §7).
          canAssign && user.status === "ACTIVE" ? (
            <Button onClick={() => setAssigning(user)}>
              <Plus aria-hidden /> Assign task
            </Button>
          ) : null
        }
      >
        {(user) => (
          <DetailTabs
            scope={{ kind: "user", userId: user.id }}
            emptyText={`No tasks assigned to ${user.first_name} yet.`}
          />
        )}
      </UserDetail>
      {assigning ? (
        <AssignTaskDialog
          preset={{ user: { id: assigning.id, name: fullName(assigning) } }}
          onClose={() => setAssigning(null)}
        />
      ) : null}
    </>
  );
}
