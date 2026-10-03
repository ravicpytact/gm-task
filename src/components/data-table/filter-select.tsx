"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

/** A list filter: "Status: All" and its options. `null` means no filter. */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (value: string | null) => void;
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? null : next)}>
      <SelectTrigger aria-label={label} className="w-full sm:w-44">
        {/* Label and value together on the left; the chevron stays on the right. */}
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="text-muted-foreground">{label}:</span>
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
