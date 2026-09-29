/**
 * Where to send somebody once they are signed in.
 *
 * A booking page that stops a visitor to ask for an account has to remember
 * where they were going, and that destination arrives from the URL — which
 * means it arrives from whoever wrote the link. Only a path on this site is
 * ever allowed back out.
 *
 * The trap is "//somewhere.example": it starts with a slash, so a check on the
 * first character alone lets it through, and browsers read it as a complete
 * URL to another host. That turns our own login page into a way of sending
 * people somewhere else with our name on the link.
 */
export function safeNext(value: unknown): string {
  const next = String(value ?? "").trim();
  if (!next.startsWith("/")) return "";
  // Both slashes and backslashes: browsers normalise "/\evil.example" the
  // same way they normalise "//evil.example".
  if (next.startsWith("//") || next.startsWith("/\\")) return "";
  return next;
}

/**
 * Where a confirmation link should land, from the `next` it carries.
 *
 * The confirm-signup email is sent by Supabase from a template, and the only
 * per-person value a template can carry is {{ .RedirectTo }} -- the whole
 * emailRedirectTo URL that signUp() was given, which for us is
 * "https://jobamooz.com/auth/callback?next=/somewhere". That is the PKCE
 * route, and PKCE only works on the browser that started the signup; the
 * point of the token_hash link is to work from any device. So the link is
 * pointed at /auth/confirm instead, and this unwraps the destination the
 * callback URL was carrying.
 *
 * Only our own origin is unwrapped. Anything else -- another host, a
 * protocol-relative "//evil", a string that is not a URL -- is not a
 * destination, and the caller falls back to the dashboard.
 */
export function destinationFromConfirmLink(raw: unknown, origin: string): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (value.startsWith("/")) return safeNext(value);

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "";
  }
  if (url.origin !== origin) return "";

  // The callback route without its code would only bounce to the login page
  // with an error; what it was carrying is the real destination.
  if (url.pathname === "/auth/callback") {
    return safeNext(url.searchParams.get("next"));
  }
  return safeNext(url.pathname + url.search);
}
