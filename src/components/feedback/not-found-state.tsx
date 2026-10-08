import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** A detail page whose record is not there (deleted, or not yours), with the way back to its list. */
export function NotFoundState({
  message,
  back,
}: {
  message: string;
  back: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">{message}</p>
      <Button asChild variant="outline">
        <Link href={back.href}>
          <ArrowLeft aria-hidden /> {back.label}
        </Link>
      </Button>
    </div>
  );
}
