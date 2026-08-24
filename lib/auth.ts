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
