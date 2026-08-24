import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Keeps the login session fresh, and while SITE_PRIVATE is on, keeps the site
 * out of sight.
 *
 * The gate is real authentication rather than a cookie sniff — the session is
 * being refreshed here anyway, so asking who it belongs to costs nothing extra.
 * Signed in means the whole site as normal; signed out means a holding page
 * that says nothing about what any of this is.
 *
 * Set SITE_PRIVATE to anything but "true" to open the doors. No code change.
 */
const PUBLIC_PATHS = [
  "/soon",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth",
  // Google's reviewers must be able to read these to verify the OAuth app, and
  // a privacy policy nobody can open is not a privacy policy.
  "/privacy",
  "/terms",
  "/contact",
];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  if (process.env.SITE_PRIVATE !== "true") return response;

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isPublic || user) return response;

  // Rewritten, not redirected: the address stays whatever they typed, so a
  // link someone shares today still lands correctly once the site opens.
  return NextResponse.rewrite(new URL("/soon", request.url), {
    headers: response.headers,
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
