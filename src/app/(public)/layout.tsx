// Screens reachable without a session: login, invitation, password reset (docs/08-frontend §2).
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
