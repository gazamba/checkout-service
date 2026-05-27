import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * OPTIMISTIC, cookie-only auth routing (Next.js 16 renamed Middleware -> Proxy).
 *
 * This is NOT the security boundary. It only checks for the *presence* of the
 * session cookie to redirect early and keep route rules in one place as the app
 * grows. A present cookie can still be expired/revoked — so the real checks stay
 * server-side: the /checkout page calls getSession(), and POST /api/checkout
 * returns 401.
 *
 * Keep this thin: it runs on every matched request (including prefetches), so no
 * DB calls or slow work here.
 */
export function proxy(request: NextRequest) {
  const isAuthed = Boolean(getSessionCookie(request));
  const { pathname } = request.nextUrl;

  // Unauthenticated users can't reach the checkout flow.
  if (pathname.startsWith("/checkout") && !isAuthed) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Authenticated users skip the auth pages.
  if ((pathname === "/signin" || pathname === "/signup") && isAuthed) {
    return NextResponse.redirect(new URL("/checkout", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout/:path*", "/signin", "/signup"],
};
