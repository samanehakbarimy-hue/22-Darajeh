import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * The signed-in user, fetched once per request no matter who asks.
 *
 * getUser() is a network call to Supabase in Ireland, and a single page render
 * was making three of them: the proxy refreshing the session, the navbar
 * deciding which links to draw, and the page itself. From Iran that is two
 * round trips of latency spent re-answering a question already answered.
 *
 * React's cache() dedupes within one render pass, so every caller after the
 * first gets the same promise. Still a real getUser rather than a decoded
 * cookie — the security property is unchanged, only the repetition is gone.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Whether the caller is an admin, asked of the database rather than worked out
 * here.
 *
 * `public.is_admin()` is the same function every admin-only policy is written
 * against, so this cannot drift from what the database will actually allow —
 * which is the entire point of asking it rather than reading `profiles.role`
 * a second way. It answers false for a signed-out caller on its own.
 *
 * Cached per render like getCurrentUser, so guarding several actions or
 * reading it in a page costs one round trip, not several.
 */
export const isAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
});
