import { NextRequest, NextResponse } from "next/server";

// Authenticated users are bounced away from these (you're already logged in)
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/verify-otp", "/reset-password"];

// These are public regardless of auth state — never redirect away from them
const ALWAYS_PUBLIC_PATHS = ["/setup-account"];

export function middleware(request: NextRequest) {
  // Dev bypass: uncomment the line below to skip auth checks during development
  // return NextResponse.next();

  const { pathname } = request.nextUrl;

  const isAuthPath        = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAlwaysPublic    = ALWAYS_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Check the HTTP-only refresh_token cookie set by the backend.
  // We use refresh_token (not access_token) so the middleware doesn't
  // gate on the 30-minute window — the API layer handles access token renewal.
  const token = request.cookies.get("refresh_token")?.value;

  // Already authenticated — redirect away from login/register pages only
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // setup-account and similar pages are always accessible — skip auth check
  if (isAlwaysPublic) {
    return NextResponse.next();
  }

  // Protected route — no token — redirect to login
  if (!isAuthPath && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except API proxy, Next.js internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public/).*)"],
};
