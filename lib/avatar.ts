import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * True for avatar URLs served by an identity provider rather than by us.
 * LinkedIn signs these with an expiry (`e=` in the query string), so a profile
 * pointing at one loses its photo once that date passes.
 */
export function isProviderAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /(?:licdn\.com|googleusercontent\.com|fbcdn\.net)/i.test(url);
}

/**
 * Copies a provider-hosted avatar into our own storage bucket and returns the
 * public URL. Returns null if anything goes wrong — a missing photo must never
 * be a reason someone can't sign in.
 */
export async function storeRemoteAvatar(
  supabase: SupabaseClient,
  userId: string,
  remoteUrl: string,
): Promise<string | null> {
  try {
    const response = await fetch(remoteUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;

    const contentType = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const extension = EXTENSION_BY_TYPE[contentType];
    if (!extension) return null;

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_AVATAR_BYTES) {
      return null;
    }

    const path = `${userId}/linkedin.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, bytes, { upsert: true, contentType });

    if (uploadError) return null;

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    // Cache-bust so a replaced photo shows up straight away.
    return `${publicUrl}?t=${Date.now()}`;
  } catch {
    return null;
  }
}
