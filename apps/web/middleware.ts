import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/resources", "/logs", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("locallink_session");

  if ((pathname === "/login" || pathname === "/") && hasSession) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.search = "";
    return NextResponse.redirect(dashUrl);
  }

  if (protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    if (!hasSession) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/resources/:path*", "/logs/:path*", "/settings/:path*"],
};
