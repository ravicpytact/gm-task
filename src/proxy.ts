import { type NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, LOGIN_PATH, PUBLIC_PATHS, REFRESH_COOKIE } from "@/lib/auth/constants";

/**
 * Optimistic route guard (FE-AUTH-004): it only checks that session cookies exist.
 * It never decodes tokens, never calls the backend and never refreshes (FE-AUTH-003);
 * group layouts make the authoritative check.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }
  if (request.cookies.has(ACCESS_COOKIE)) return NextResponse.next();

  const next = encodeURIComponent(pathname + search);
  if (request.cookies.has(REFRESH_COOKIE)) {
    return NextResponse.redirect(new URL(`/api/auth/refresh?next=${next}`, request.url));
  }
  return NextResponse.redirect(new URL(`${LOGIN_PATH}?next=${next}`, request.url));
}

export const config = {
  // Pages only: not route handlers, framework assets, or files with an extension.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
