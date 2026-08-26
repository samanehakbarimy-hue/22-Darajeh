import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isProviderAvatarUrl, storeRemoteAvatar } from "@/lib/avatar";

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

      // A seeker gave their mobile when signing up, where there was no session
      // yet to write it with. It travelled here in the account metadata; store
      // it now, and never over an existing one — the account settings page is
      // where a number gets changed, not a second confirmation link.
      const meta = data.user.user_metadata ?? {};
      const metaPhone = typeof meta.phone === "string" ? meta.phone : "";

      if (meta.role === "seeker" && metaPhone) {
        const { data: existingContact } = await supabase
          .from("seeker_contacts")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!existingContact) {
          await supabase
            .from("seeker_contacts")
            .insert({ id: data.user.id, phone: metaPhone });
        }
      }

      // When an existing email/password account signs in with LinkedIn for
      // the first time, Supabase links the identity to that same account
      // instead of creating a new one — which means the profile-creation
      // trigger never runs, so a real photo/name sitting right there in the
      // linked identity never makes it into the profile. Backfill it here,
      // but only fields the user hasn't already set themselves.
      const linkedIdentity = data.user.identities?.find(
        (identity) => identity.provider !== "email",
      );

      if (linkedIdentity) {
        const identityData = linkedIdentity.identity_data ?? {};
        const photoUrl = identityData.picture ?? identityData.avatar_url;
        const fullName =
          identityData.full_name ??
          identityData.name ??
          [identityData.given_name, identityData.family_name]
            .filter(Boolean)
            .join(" ");

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("photo_url, full_name")
          .eq("id", data.user.id)
          .maybeSingle();

        const patch: { photo_url?: string; full_name?: string } = {};

        // Provider avatar URLs are signed and expire, so the photo would
        // vanish later. Keep our own copy instead — both when there is no
        // photo yet, and when the stored one still points at the provider.
        const needsOwnCopy =
          !existingProfile?.photo_url ||
          isProviderAvatarUrl(existingProfile.photo_url);

        if (photoUrl && needsOwnCopy) {
          const storedUrl = await storeRemoteAvatar(
            supabase,
            data.user.id,
            photoUrl,
          );
          // Fall back to the provider URL only when we have nothing already;
          // a working expiring photo beats no photo, but never replace a
          // stored copy with one.
          if (storedUrl) {
            patch.photo_url = storedUrl;
          } else if (!existingProfile?.photo_url) {
            patch.photo_url = photoUrl;
          }
        }

        if (fullName && !existingProfile?.full_name) {
          patch.full_name = fullName;
        }

        if (Object.keys(patch).length > 0) {
          await supabase.from("profiles").update(patch).eq("id", data.user.id);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirm_failed`);
}
