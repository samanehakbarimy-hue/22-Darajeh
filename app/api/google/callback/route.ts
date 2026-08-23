import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode, googleEmail, isGoogleConfigured } from "@/lib/google/meet";

const STATE_COOKIE = "google_oauth_state";

/** Where Google sends the specialist back after they approve or decline. */
export async function GET(request: NextRequest) {
  // Built from the request so this works before NEXT_PUBLIC_SITE_URL is set.
  const back = (status: string) =>
    NextResponse.redirect(
      new URL(`/dashboard/mentor/profile?google=${status}`, request.url),
    );

  if (!isGoogleConfigured()) return back("off");

  const params = request.nextUrl.searchParams;

  // The specialist pressed cancel on Google's screen. Not an error.
  if (params.get("error")) return back("cancelled");

  const code = params.get("code");
  const state = params.get("state");

  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);

  // A missing or mismatched state means this callback did not come from a
  // flow we started, so it could be someone else's account being attached.
  if (!code || !state || !expected || state !== expected) {
    return back("failed");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return back("failed");

  const tokens = await exchangeCode(code);
  if (!tokens) return back("failed");

  // Calendar access is a checkbox on Google's screen, and leaving it
  // unticked still returns a valid token. Storing that would look like a
  // success and fail only later, when a booking is accepted.
  if (tokens === "missing-calendar-scope") return back("no-calendar");

  const email = await googleEmail(tokens.accessToken);

  // RLS scopes this to the caller, so a specialist can only ever attach an
  // account to themselves.
  const { error } = await supabase.from("mentor_google_accounts").upsert({
    id: user.id,
    refresh_token: tokens.refreshToken,
    google_email: email,
    connected_at: new Date().toISOString(),
  });
  if (error) return back("failed");

  return back("connected");
}
