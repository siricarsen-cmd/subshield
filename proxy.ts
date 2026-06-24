import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that never require a login wall
  const isPublicPath = path === "/login" || path === "/";

  // Check for the presence of our secure session cookie
  const sessionToken = request.cookies.get("subshield_session_token")?.value;

  // If a public page is accessed, let them flow normally
  if (isPublicPath) {
    return NextResponse.next();
  }

  // If the user attempts to access protected routes without a token
  if (!sessionToken && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Intercept all dashboard tracking nodes and custom singular report views
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/report/:path*",
  ],
};