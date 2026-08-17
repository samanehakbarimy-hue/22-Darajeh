import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // If this looks like their very first sign-in and they came from the
      // mentor/seeker signup button specifically, align their role with
      // that choice (the auto-created profile otherwise defaults to seeker).
      const createdAt = new Date(data.user.created_at).getTime();
      const lastSignInAt = new Date(
        data.user.last_sign_in_at ?? data.user.created_at,
      ).getTime();
      const isFirstSignIn = Math.abs(lastSignInAt - createdAt) < 10_000;

      if (isFirstSignIn && (role === "mentor" || role === "seeker")) {
        await supabase
          .from("profiles")
          .update({ role })
          .eq("id", data.user.id);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirm_failed`);
}
