import Link from "next/link";
import { HOME_PATH } from "@/lib/auth/constants";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center"
    >
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page you were looking for does not exist.</p>
      <Button asChild>
        <Link href={HOME_PATH}>Go to Todos</Link>
      </Button>
    </main>
  );
}
