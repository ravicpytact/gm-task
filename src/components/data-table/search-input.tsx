"use client";

import { Search, X } from "lucide-react";
import { useEffect, useEffectEvent, useId, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 300;

/**
 * The list's search box. Typing stays local; the URL (and so the query) changes only after a
 * pause (FE-DATA-004), never on every keystroke.
 */
export function SearchInput({
  value,
  onSearch,
  label,
  placeholder,
}: {
  /** The search in the URL. */
  value: string;
  onSearch: (value: string) => void;
  label: string;
  placeholder: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [urlValue, setUrlValue] = useState(value);
  // The URL changed from elsewhere (back button, "clear filters"): show it.
  if (value !== urlValue) {
    setUrlValue(value);
    if (value !== draft.trim()) setDraft(value);
  }

  const debounced = useDebouncedValue(draft, DEBOUNCE_MS);
  const push = useEffectEvent((next: string) => {
    if (next !== value) onSearch(next);
  });
  useEffect(() => push(debounced.trim()), [debounced]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        id={id}
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className="pr-9 pl-8"
      />
      {draft ? (
        <button
          type="button"
          onClick={() => setDraft("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
