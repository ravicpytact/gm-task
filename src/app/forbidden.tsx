import Link from "next/link";
import { HOME_PATH } from "@/lib/auth/constants";
import { Button } from "@/components/ui/button";

// Rendered by requirePermission() in a group layout (FE-AUTH-004).
export default function Forbidden() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">You don&apos;t have access to this page</h1>
      <p className="text-muted-foreground">Ask an Admin if you think you should.</p>
      <Button asChild>
        <Link href={HOME_PATH}>Go to the dashboard</Link>
      </Button>
    </div>
  );
}
