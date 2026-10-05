"use client";

import { ThemeProvider } from "next-themes";
import { createContext, useContext, useState, type ReactNode } from "react";
import { applyAccent, MODE_STORAGE_KEY, type Accent } from "./appearance";

const AccentContext = createContext<{ accent: Accent; setAccent: (accent: Accent) => void } | null>(
  null,
);

/**
 * Mode and accent for the whole app. `initialAccent` comes from the cookie on the server, so the
 * first render already knows it; the mode is applied by next-themes before the page paints.
 */
export function AppearanceProvider({
  initialAccent,
  children,
}: {
  initialAccent: Accent;
  children: ReactNode;
}) {
  const [accent, setAccentState] = useState(initialAccent);
  const setAccent = (next: Accent) => {
    applyAccent(next);
    setAccentState(next);
  };
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={MODE_STORAGE_KEY}
    >
      <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>
    </ThemeProvider>
  );
}

export function useAccent() {
  const value = useContext(AccentContext);
  if (!value) throw new Error("useAccent needs an AppearanceProvider.");
  return value;
}
