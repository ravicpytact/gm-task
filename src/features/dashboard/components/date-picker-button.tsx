"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { PendingCalendar, monthOf } from "@/features/assignments";

/**
 * The dashboard's date pill: "Today · 03 Oct 2026". It opens the pending-dates calendar (Screen 07)
 * as a popover on wide screens and a bottom sheet on phones; choosing a day closes it.
 */
export function DatePickerButton({
  label,
  date,
  onSelectDay,
}: {
  label: string;
  /** The day shown, as the server resolved it. */
  date: string | undefined;
  onSelectDay: (day: string) => void;
}) {
  const wide = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [month, setMonth] = useState<string | null>(date ? monthOf(date) : null);

  const openChange = (next: boolean) => {
    if (next) setMonth(date ? monthOf(date) : null); // always open on the chosen day's month
    setOpen(next);
  };
  const choose = (day: string) => {
    onSelectDay(day);
    setOpen(false);
  };

  const calendar = (
    <PendingCalendar month={month} onMonthChange={setMonth} selected={date} onSelectDay={choose} />
  );

  // One open state for both forms, set by the button itself: the screen-size check settles just
  // after the page loads, and a click in that moment must still open the calendar.
  return (
    <Popover open={open && wide} onOpenChange={openChange}>
      <PopoverAnchor asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          className="rounded-full"
          aria-label={`${label}. Open the calendar`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => openChange(!open)}
        >
          <CalendarDays aria-hidden />
          {label}
          <ChevronDown className="opacity-50" aria-hidden />
        </Button>
      </PopoverAnchor>
      <PopoverContent
        align="end"
        className="w-88 p-4"
        // The button toggles; a press on it is not "outside".
        onInteractOutside={(e) => {
          if (triggerRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        {calendar}
      </PopoverContent>
      <Drawer open={open && !wide} onOpenChange={openChange}>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>Pending dates</DrawerTitle>
            <DrawerDescription>Choose a date to see its pending Todos.</DrawerDescription>
          </DrawerHeader>
          <div className="mx-auto w-full max-w-sm px-4 pt-2 pb-6">{calendar}</div>
        </DrawerContent>
      </Drawer>
    </Popover>
  );
}
