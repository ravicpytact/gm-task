"use client";

import { tableFeatures, useTable, type ColumnDef, type RowData } from "@tanstack/react-table";
import { cn } from "cn";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** A column: what it is called, what each row shows, and (optionally) the server's sort key. */
export type DataColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** The backend's sort_by value; makes the header a sort button. */
  sortKey?: string;
  /** Visually hidden header (an actions column). */
  hideHeader?: boolean;
  className?: string;
};

export type DataTableSort = {
  by: string;
  order: "asc" | "desc";
  onSortChange: (by: string, order: "asc" | "desc") => void;
};

type DataTableProps<T extends RowData> = {
  /** Read by screen readers: what the table lists. */
  caption: string;
  rows: T[];
  columns: DataColumn<T>[];
  getRowId: (row: T) => string;
  /** The small-screen layout: one card per row (FE-UI-005). */
  renderCard: (row: T) => ReactNode;
  sort?: DataTableSort | undefined;
  /** Background refetch: keep the rows, show a quiet indicator (FE-UI-003). */
  refreshing?: boolean;
};

// No table features: searching, sorting and paging are done by the backend and live in the URL
// (FE-DATA-004), so the table only lays rows out.
const features = tableFeatures({});

/**
 * The one data table (FE-UI-002). From `md` a table; below it a list of cards.
 * The four view states are the caller's: render this only with rows to show.
 */
export function DataTable<T extends RowData>({
  caption,
  rows,
  columns,
  getRowId,
  renderCard,
  sort,
  refreshing = false,
}: DataTableProps<T>) {
  const tableColumns = useMemo<ColumnDef<typeof features, T>[]>(
    () =>
      columns.map((column) => ({
        id: column.id,
        header: column.header,
        cell: ({ row }) => column.cell(row.original),
      })),
    [columns],
  );
  const table = useTable({
    features,
    columns: tableColumns,
    data: rows,
    getRowId: (row) => getRowId(row),
  });
  const byId = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);

  return (
    <div className="relative" aria-busy={refreshing}>
      {refreshing ? (
        <div className="absolute inset-x-0 -top-2 h-0.5 animate-pulse rounded-full bg-primary/60" />
      ) : null}

      <ul className="flex flex-col gap-3 md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li key={getRowId(row)}>{renderCard(row)}</li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-xl bg-card shadow-card md:block">
        <Table>
          <TableCaption className="sr-only">{caption}</TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const column = byId.get(header.column.id);
                  return (
                    <TableHead
                      key={header.id}
                      className={column?.className}
                      aria-sort={ariaSort(sort, column?.sortKey)}
                    >
                      {column?.hideHeader ? (
                        <span className="sr-only">{column.header}</span>
                      ) : column?.sortKey && sort ? (
                        <SortButton column={column} sort={sort} />
                      ) : (
                        column?.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className={byId.get(cell.column.id)?.className}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ariaSort(sort: DataTableSort | undefined, key: string | undefined) {
  if (!sort || !key) return undefined;
  if (sort.by !== key) return "none" as const;
  return sort.order === "asc" ? ("ascending" as const) : ("descending" as const);
}

function SortButton<T>({ column, sort }: { column: DataColumn<T>; sort: DataTableSort }) {
  const key = column.sortKey ?? column.id;
  const active = sort.by === key;
  const Icon = !active ? ArrowUpDown : sort.order === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => sort.onSortChange(key, active && sort.order === "asc" ? "desc" : "asc")}
      className={cn(
        "-ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active && "text-primary",
      )}
    >
      {column.header}
      <Icon className={active ? "size-3.5" : "size-3.5 opacity-40"} aria-hidden />
    </button>
  );
}
