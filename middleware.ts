import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const auth = request.cookies.get("auth");
  const password = process.env.DASHBOARD_PASSWORD;
  const pathname = request.nextUrl.pathname;

  const isLoginPage = pathname === "/";
  const isApiAuth = pathname === "/api/auth";
  const isApiLogout = pathname === "/api/logout";

  if (isLoginPage || isApiAuth || isApiLogout) {
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/jobs") ||
    pathname.startsWith("/api/tailor");

  if (isProtected && auth?.value !== password) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/jobs/:path*", "/api/tailor/:path*"],
};
