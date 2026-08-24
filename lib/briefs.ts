import type { SupabaseClient } from "@supabase/supabase-js";

/** How long a link to an attachment stays good for. */
const SIGNED_URL_SECONDS = 60 * 30;

/**
 * A temporary link to a brief's attachment, or null.
 *
 * The bucket is private, so there is no permanent URL to hand out — which is
 * the point: a brief holds someone's unpublished work, and a public link would
 * be readable by anyone who ever saw it. Signing runs as the logged-in user, so
 * the storage policy still decides, and someone who is not party to the brief
 * gets nothing back rather than a working link.
 */
export async function signAttachment(
  supabase: SupabaseClient,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage
    .from("project-files")
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  return data?.signedUrl ?? null;
}
