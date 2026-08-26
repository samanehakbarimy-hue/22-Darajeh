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
