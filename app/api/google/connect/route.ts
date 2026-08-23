import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consentUrl, isGoogleConfigured } from "@/lib/google/meet";

const STATE_COOKIE = "google_oauth_state";

/**
 * Starts the Google connection for a signed-in specialist.
 *
 * The random `state` is stored in a short-lived cookie and echoed back by
 * Google, so the callback can tell a genuine return from someone else's link.
 * Without it, anyone could hand a specialist a URL that attaches THEIR Google
 * account to that specialist's profile.
 */
export async function GET(request: NextRequest) {
  // Redirects are built from the incoming request, not from
  // NEXT_PUBLIC_SITE_URL: that variable is absent until Google is set up,
  // and redirecting to an empty string throws. Only the OAuth redirect_uri
  // itself has to be the configured public address, because Google compares
  // it against what is registered.
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (!isGoogleConfigured()) {
    return to("/dashboard/mentor/profile?google=off");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return to("/login?next=/dashboard/mentor/profile");
  }

  const state = randomUUID();
  const jar = await cookies();
  jar.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(consentUrl(state));
}
