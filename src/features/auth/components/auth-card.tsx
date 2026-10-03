import { ListChecks } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME } from "@/config/constants";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

/** The frame of every public screen (Screens 01–04): brand, heading, one card. Mobile-first. */
export function AuthCard({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description?: string | undefined;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ListChecks className="size-7" aria-label={APP_NAME} />
        </span>
        <h1 className="type-page-title">{title}</h1>
        {description ? <p className="type-label font-normal">{description}</p> : null}
      </div>
      <Card>
        <CardContent>{children}</CardContent>
        {footer ? <CardFooter className="justify-center">{footer}</CardFooter> : null}
      </Card>
    </div>
  );
}

/** The quiet text link under an auth card ("Forgot password?", "Back to sign in"). */
export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-sm text-primary underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
