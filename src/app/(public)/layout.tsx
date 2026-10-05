import { ModeToggleButton } from "@/components/layout/appearance-controls";

// Screens reachable without a session: login, invitation, password reset (docs/08-frontend §2).
// They follow this device's saved mode; the corner button switches light and dark.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="relative flex flex-1 items-center justify-center px-4 py-10">
      <div className="absolute top-3 right-3">
        <ModeToggleButton />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
