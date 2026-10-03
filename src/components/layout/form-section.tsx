import type { ReactNode } from "react";

/**
 * The standard layout of a form page section (FE-UI §3.2, nextjs-ui-system).
 * Desktop: what the section is for on the left, the form card on the right.
 * Phone: the card alone, full width; the explanation column is not shown, so put anything a phone
 * user must read inside the card as well.
 */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3 md:gap-8">
      <div className="hidden md:flex md:flex-col md:gap-2">
        <h2 className="type-section-title">{title}</h2>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">{description}</div>
      </div>
      <div className="min-w-0 md:col-span-2 md:max-w-xl">{children}</div>
    </section>
  );
}

/** Caps the width of form pages so wide screens keep a readable line length. */
export function FormPage({ children }: { children: ReactNode }) {
  return <div className="max-w-5xl">{children}</div>;
}
