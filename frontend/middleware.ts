import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Simple token check. In a real app with next-auth, you might use auth() middleware.
  const hasToken =
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token") ||
    request.cookies.has("access_token");

  if (!hasToken) {
    if (pathname.startsWith("/owners/dashboard")) {
      return NextResponse.redirect(new URL("/owners/login", request.url));
    }
    if (pathname.startsWith("/tenants/dashboard")) {
      return NextResponse.redirect(new URL("/tenants/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/owners/dashboard/:path*", "/tenants/dashboard/:path*"],
};
