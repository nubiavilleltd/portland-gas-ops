import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/verify-otp", "/reset-password", "/setup-account"];

export function middleware(request: NextRequest) {
  // Dev bypass: uncomment the line below to skip auth checks during development
  // return NextResponse.next();

  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Check the HTTP-only refresh_token cookie set by the backend.
  // We use refresh_token (not access_token) so the middleware doesn't
  // gate on the 30-minute window — the API layer handles access token renewal.
  const token = request.cookies.get("refresh_token")?.value;

  // Already authenticated — redirect away from login
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protected route — no token — redirect to login
  if (!isPublicPath && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except Next.js internals and static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
