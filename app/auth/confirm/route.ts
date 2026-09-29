import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/next-path";
import { sendWelcomeToSpecialist } from "@/lib/email/notifications";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Through safeNext, because this is pasted together with the origin below
  // and "@example.invalid" makes `https://jobamooz.com@example.invalid` --
  // which browsers read as our name being the username and the host being
  // theirs. A confirmation link with our domain on it that lands somewhere
  // else is the whole trick.
  const next = safeNext(searchParams.get("next")) || "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // A specialist arriving here for the first time is owed one letter. The
      // decision of whether this is the first time is the database's, not
      // ours — see claim_welcome_email(). Awaited rather than left running,
      // because this function stops existing the moment it answers.
      await sendWelcomeToSpecialist(supabase);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirm_failed`);
}
