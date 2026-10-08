import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// The parts of a detail page (one record): where it sits, what it is, the facts about it and its
// counts. Features fill them; the layout is the same on every detail page.

/**
 * The title row of a detail page: a breadcrumb back to the list ("Users / Ravi Patel"), the
 * record's name, badges beside it, and its actions. Phones stack the actions under the title.
 */
export function DetailHeader({
  parent,
  title,
  badges,
  actions,
}: {
  /** The list this record belongs to; the breadcrumb links back to it. */
  parent: { label: string; href: string };
  title: string;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <li>
            <Link href={parent.href} className="rounded-sm hover:text-foreground hover:underline">
              {parent.label}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li aria-current="page" className="min-w-0 truncate text-foreground">
            {title}
          </li>
        </ol>
      </nav>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="type-page-title break-words">{title}</h1>
          {badges}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export type Fact = { label: string; value: ReactNode; hidden?: boolean };

/** What is known about a record, as label / value pairs: two columns from `sm`, one on phones. */
export function FactList({ facts }: { facts: Fact[] }) {
  return (
    <Card size="sm">
      <CardContent>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {facts
            .filter((f) => !f.hidden)
            .map((f) => (
              <div key={f.label} className="flex min-w-0 flex-col gap-0.5">
                <dt className="type-caption">{f.label}</dt>
                <dd className="text-sm break-words">{f.value}</dd>
              </div>
            ))}
        </dl>
      </CardContent>
    </Card>
  );
}

/** "—": a fact with no value (no description, no end date, created by an Admin since deleted). */
export function NoValue({ label = "None" }: { label?: string }) {
  return (
    <span className="text-muted-foreground" aria-label={label}>
      —
    </span>
  );
}

/** Small count tiles: "Assignments 7 · Todos 640 · …". `null` while they load. */
export function CountTiles({ counts }: { counts: { label: string; value: number }[] | null }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-busy={counts === null}>
      {counts === null
        ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-18 rounded-xl" />)
        : counts.map((c) => (
            <Card key={c.label} size="sm">
              <CardContent className="flex flex-col gap-1">
                <span className="type-caption">{c.label}</span>
                <span className="text-2xl font-semibold tabular-nums">{formatNumber(c.value)}</span>
              </CardContent>
            </Card>
          ))}
    </div>
  );
}
