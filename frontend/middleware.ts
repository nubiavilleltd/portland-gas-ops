import { NextRequest, NextResponse } from "next/server";
import { TOKEN_COOKIE_NAME } from "@/lib/constants";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/verify-otp", "/reset-password"];

export function middleware(request: NextRequest) {
  // Dev bypass: set NEXT_PUBLIC_DEV_BYPASS_AUTH=true in .env.local to skip auth
  return NextResponse.next();
  // if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
  //   return NextResponse.next();
  // }

  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  // Already authenticated — redirect away from login
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/home", request.url));
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
