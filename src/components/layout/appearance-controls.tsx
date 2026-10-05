"use client";

import { cn } from "cn";
import { Check, Monitor, Moon, Palette, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import {
  ACCENT_LABELS,
  ACCENTS,
  MODE_LABELS,
  MODES,
  type Accent,
  type Mode,
} from "@/lib/stores/appearance";
import { useAccent } from "@/lib/stores/appearance-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Appearance controls (FE-UI-010): mode and accent theme, saved on this device.

const MODE_ICONS: Record<Mode, LucideIcon> = { light: Sun, dark: Moon, system: Monitor };

const SWATCH: Record<Accent, string> = {
  // The "on" style of a toggle would repaint the swatch; keep its colour when chosen.
  indigo: "bg-swatch-indigo data-[state=on]:bg-swatch-indigo hover:bg-swatch-indigo",
  blue: "bg-swatch-blue data-[state=on]:bg-swatch-blue hover:bg-swatch-blue",
  teal: "bg-swatch-teal data-[state=on]:bg-swatch-teal hover:bg-swatch-teal",
  violet: "bg-swatch-violet data-[state=on]:bg-swatch-violet hover:bg-swatch-violet",
  slate: "bg-swatch-slate data-[state=on]:bg-swatch-slate hover:bg-swatch-slate",
  cyan: "bg-swatch-cyan data-[state=on]:bg-swatch-cyan hover:bg-swatch-cyan",
  fuchsia: "bg-swatch-fuchsia data-[state=on]:bg-swatch-fuchsia hover:bg-swatch-fuchsia",
  stone: "bg-swatch-stone data-[state=on]:bg-swatch-stone hover:bg-swatch-stone",
  khaki: "bg-swatch-khaki data-[state=on]:bg-swatch-khaki hover:bg-swatch-khaki",
  mocha: "bg-swatch-mocha data-[state=on]:bg-swatch-mocha hover:bg-swatch-mocha",
};

/** The saved mode, once the browser has read it (the server never knows it). */
function useMode(): [Mode | undefined, (mode: Mode) => void] {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const mode = hydrated ? MODES.find((m) => m === theme) : undefined;
  return [mode, setTheme];
}

/** Light / Dark / System as a segmented switch. */
export function ModeSwitch({ id }: { id?: string }) {
  const [mode, setMode] = useMode();
  return (
    <ToggleGroup
      id={id}
      type="single"
      variant="outline"
      spacing={0}
      value={mode ?? ""}
      onValueChange={(value) => value && setMode(value as Mode)}
      aria-label="Mode"
    >
      {MODES.map((m) => {
        const Icon = MODE_ICONS[m];
        return (
          <ToggleGroupItem
            key={m}
            value={m}
            className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Icon aria-hidden /> {MODE_LABELS[m]}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

/** The accent themes as colour swatches; the name of each is its label. */
export function AccentPicker({ id }: { id?: string }) {
  const { accent, setAccent } = useAccent();
  return (
    <div className="flex flex-col gap-2">
      <ToggleGroup
        id={id}
        type="single"
        spacing={2}
        value={accent}
        onValueChange={(value) => value && setAccent(value as Accent)}
        aria-label="Colour theme"
        className="flex-wrap"
      >
        {ACCENTS.map((a) => (
          <ToggleGroupItem
            key={a}
            value={a}
            aria-label={ACCENT_LABELS[a]}
            title={ACCENT_LABELS[a]}
            className={cn(
              "size-9 min-w-0 rounded-full p-0 ring-offset-2 ring-offset-background",
              SWATCH[a],
              "hover:opacity-90 data-[state=on]:ring-2 data-[state=on]:ring-foreground",
            )}
          >
            {accent === a ? <Check className="text-on-swatch" aria-hidden /> : null}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="type-caption">{ACCENT_LABELS[accent]}</p>
    </div>
  );
}

/** "Appearance" in the account menu: the same choices as menu radios. */
export function AppearanceMenu() {
  const [mode, setMode] = useMode();
  const { accent, setAccent } = useAccent();
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Palette aria-hidden /> Appearance
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-44">
        <DropdownMenuLabel className="type-caption">Mode</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode ?? ""} onValueChange={(v) => setMode(v as Mode)}>
          {MODES.map((m) => {
            const Icon = MODE_ICONS[m];
            return (
              <DropdownMenuRadioItem key={m} value={m}>
                <Icon aria-hidden /> {MODE_LABELS[m]}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="type-caption">Colour theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={accent} onValueChange={(v) => setAccent(v as Accent)}>
          {ACCENTS.map((a) => (
            <DropdownMenuRadioItem key={a} value={a}>
              <span className={cn("size-3.5 rounded-full", SWATCH[a])} aria-hidden />
              {ACCENT_LABELS[a]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/** A sun/moon button for screens without the account menu (sign-in): light ⇄ dark. */
export function ModeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const dark = hydrated && resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}
