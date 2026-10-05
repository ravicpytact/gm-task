"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type SelectOption = { value: string; label: string; hint?: string | undefined };

type CommonProps = {
  id?: string;
  /** The options for the current search; the caller fetches them (the backend searches). */
  options: SelectOption[];
  /** Called (debounced) as the person types in the search box. */
  onSearch: (search: string) => void;
  loading?: boolean;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
  disabled?: boolean;
  /** Labels for values chosen before this mount (e.g. a filter read from the URL). */
  knownLabels?: Record<string, string> | undefined;
};

export type SingleSelectProps = CommonProps & {
  multiple?: false;
  value: string | null;
  onChange: (value: string | null) => void;
  /** Allows clearing the choice (filters); forms usually require one. */
  clearable?: boolean;
};

export type MultiSelectProps = CommonProps & {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

/** What a wrapper that fetches its own options (a user or task picker) provides itself. */
export type FetchedSelectProps =
  "options" | "onSearch" | "loading" | "searchPlaceholder" | "emptyText";

const SEARCH_DEBOUNCE_MS = 300;

const labelsOf = (options: SelectOption[]) =>
  Object.fromEntries(options.map((o) => [o.value, o.label])) as Record<string, string>;

/**
 * Pick one or several items from a long, server-searched list (users, tasks) — FE-UI-002.
 * Selected items keep their labels even when a new search no longer returns them.
 */
export function SearchableSelect(props: SingleSelectProps | MultiSelectProps) {
  const { options, onSearch, loading, placeholder, searchPlaceholder, emptyText, disabled } = props;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const pushSearch = useEffectEvent((value: string) => onSearch(value));
  useEffect(() => pushSearch(debounced.trim()), [debounced]);

  // Remember every label seen, so chips and the trigger can name selected values later. Compared
  // by content: callers usually build a new options array on every render.
  const optionsKey = options.map((o) => `${o.value}\u0000${o.label}`).join("\u0001");
  const [seenKey, setSeenKey] = useState(optionsKey);
  const [seen, setSeen] = useState(() => labelsOf(options));
  if (optionsKey !== seenKey) {
    setSeenKey(optionsKey);
    setSeen((previous) => ({ ...previous, ...labelsOf(options) }));
  }
  const labels = { ...seen, ...props.knownLabels, ...labelsOf(options) };
  const labelOf = (value: string) => labels[value] ?? "Selected";

  const selected = props.multiple ? props.value : props.value ? [props.value] : [];
  const isSelected = (value: string) => selected.includes(value);

  const choose = (value: string) => {
    if (props.multiple) {
      props.onChange(
        isSelected(value) ? props.value.filter((v) => v !== value) : [...props.value, value],
      );
    } else {
      props.onChange(value === props.value && props.clearable ? null : value);
      setOpen(false);
    }
  };

  const triggerText = props.multiple
    ? props.value.length === 0
      ? placeholder
      : `${props.value.length} selected`
    : props.value
      ? labelOf(props.value)
      : placeholder;

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={props.id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={props["aria-invalid"]}
            aria-describedby={props["aria-describedby"]}
            aria-label={props["aria-label"]}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span className={selected.length ? "truncate" : "truncate text-muted-foreground"}>
              {triggerText}
            </span>
            <ChevronsUpDown className="opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder={searchPlaceholder}
            />
            <CommandList>
              <CommandEmpty>{loading ? "Searching…" : emptyText}</CommandEmpty>
              <CommandGroup>
                {!props.multiple && props.clearable && props.value ? (
                  <CommandItem
                    value="__clear__"
                    onSelect={() => {
                      props.onChange(null);
                      setOpen(false);
                    }}
                  >
                    <X aria-hidden /> Clear
                  </CommandItem>
                ) : null}
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => choose(option.value)}
                  >
                    <Check className={isSelected(option.value) ? "" : "opacity-0"} aria-hidden />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{option.label}</span>
                      {option.hint ? (
                        <span className="truncate type-caption">{option.hint}</span>
                      ) : null}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {props.multiple && props.value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Selected">
          {props.value.map((value) => (
            <li key={value}>
              <Badge variant="secondary" className="gap-1 pr-1">
                {labelOf(value)}
                <button
                  type="button"
                  onClick={() => props.onChange(props.value.filter((v) => v !== value))}
                  aria-label={`Remove ${labelOf(value)}`}
                  className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
