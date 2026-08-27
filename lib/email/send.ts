/**
 * Sending mail, over Resend's HTTP API rather than their SDK — one fetch
 * against a documented endpoint is less to keep upright than another
 * dependency, and nothing here needs the parts an SDK adds.
 */

const ENDPOINT = "https://api.resend.com/emails";

/** Whether mail can actually go out. False on any environment without a key. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

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
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ??
          // The verified sending domain is the mail. subdomain, not the bare
          // one — sending as no-reply@jobamooz.com would be rejected.
          "جاب‌آموز <no-reply@mail.jobamooz.com>",
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
