"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";

/** "1–20 of 135" and previous / next. The page lives in the URL; this only asks to change it. */
export function DataTablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (total === 0) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-4">
      <p className="type-caption" aria-live="polite">
        {formatNumber(first)}–{formatNumber(last)} of {formatNumber(total)}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
