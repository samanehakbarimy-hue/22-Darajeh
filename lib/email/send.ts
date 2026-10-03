/**
 * Sending mail, over Resend's HTTP API rather than their SDK — one fetch
 * against a documented endpoint is less to keep upright than another
 * dependency, and nothing here needs the parts an SDK adds.
 */

const ENDPOINT = "https://api.resend.com/emails";

/**
 * Never throws, and never returns a rejected promise.
 *
 * Every caller is a booking action that has already changed something real —
 * a request accepted, a session called off. Failing to announce that must not
 * undo it, so the worst case here is a log line and a person who has to open
 * the site to find out, which is exactly where they were before any of this
 * existed.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Deliberate and quiet: local development and any deploy without a key
    // still runs the whole flow, it just does not post anything.
    console.info(`[email] not configured, would have sent "${subject}" to ${to}`);
    return false;
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      // This is awaited inside the auth callbacks now, so a hanging Resend
      // would hold a person's sign-in open until the platform killed it.
      // Five seconds is longer than a healthy send ever takes; past that the
      // caller is told false and gets on with its redirect.
      signal: AbortSignal.timeout(5000),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ??
          // The verified sending domain is the mail. subdomain, not the bare
          // one — sending as no-reply@jobamooz.com would be rejected.
          //
          // The tie is the logo's stand-in in an inbox list, where a real
          // image next to the sender needs either a paid certificate or a
          // Google account on the sending address. The logo is a tree whose
          // trunk is a necktie; Samaneh tried the tree first and preferred
          // the tie. The name is written the way Supabase's own sender setting
          // has it, so the emails the site sends and the ones Supabase sends
          // for it arrive under one name instead of two.
          "👔 JobAmooz <no-reply@mail.jobamooz.com>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      console.error(`[email] ${res.status} sending "${subject}":`, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[email] failed sending "${subject}":`, error);
    return false;
  }
}
