import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { getAuthMode } from "@/lib/auth-mode";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/items(.*)",
  "/tasks(.*)",
  "/calendar(.*)",
  "/history(.*)",
]);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseWs = supabaseUrl.replace(/^http/, "ws");

// Clerk mode: Clerk verifies the session, protects app routes and emits a
// strict per-request nonce CSP (including Clerk's own origins).
const clerkHandler =
  getAuthMode() === "clerk"
    ? clerkMiddleware(
        async (auth, req) => {
          if (isProtectedRoute(req)) await auth.protect();
        },
        {
          signInUrl: "/sign-in",
          signUpUrl: "/sign-up",
          contentSecurityPolicy: {
            strict: true,
            directives: {
              "connect-src": supabaseUrl ? [supabaseUrl, supabaseWs] : [],
              "img-src": ["https://img.clerk.com"],
              "frame-ancestors": ["none"],
              "form-action": ["self"],
              "base-uri": ["self"],
              "object-src": ["none"],
              ...(process.env.VERCEL ? { "upgrade-insecure-requests": [] } : {}),
            },
          },
        },
      )
    : null;

/** Demo / setup mode: no Clerk, but the same strict nonce CSP. */
function withStrictCsp(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (clerkHandler) return clerkHandler(request, event);
  return withStrictCsp(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
