"use client";

import { NoValue } from "@/components/layout/detail-page";
import { Skeleton } from "@/components/ui/skeleton";
import { usePerson } from "../queries";
import { fullName } from "../utils";

/**
 * Who created or last changed a record, from its id (`created_by`, `updated_by`). Each person is
 * read once and cached, and there are few distinct Admins. No id (the first Admin, or an Admin
 * since deleted) or a failed read shows "—".
 */
export function PersonName({ userId }: { userId: string | null }) {
  const person = usePerson(userId);
  if (userId === null || person.isError) return <NoValue label="Unknown" />;
  if (person.isPending) return <Skeleton className="inline-block h-4 w-24 align-middle" />;
  return <>{fullName(person.data.data)}</>;
}
