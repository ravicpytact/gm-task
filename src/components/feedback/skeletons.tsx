import { Skeleton } from "@/components/ui/skeleton";

/** Placeholders in the shape of the content, shown while it first loads (FE-UI-003). */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: cards }, (_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <TableSkeleton />
    </div>
  );
}
