/**
 * Google Meet links, created per booking.
 *
 * A Meet link cannot be minted on its own: Google issues one by attaching a
 * conference to a Calendar event. So accepting a booking creates an event on
 * the specialist's calendar and takes the link off it — which also means the
 * session shows up in their calendar, where they will actually see it.
 *
 * ── Setup ─────────────────────────────────────────────────────────────────
 * Needs a Google Cloud project with the Calendar API enabled and an OAuth
 * client, then three environment variables:
 *
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   NEXT_PUBLIC_SITE_URL      (e.g. https://jobamooz.com)
 *
 * The redirect URI registered with Google must be exactly:
 *   {NEXT_PUBLIC_SITE_URL}/api/google/callback
 *
 * Until those exist, isGoogleConfigured() is false and nothing here runs: the
 * connect button is hidden and specialists keep pasting their own link.
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const CALENDAR_EVENTS = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const USERINFO = "https://www.googleapis.com/oauth2/v2/userinfo";

/**
 * Only what is needed to put an event on the calendar. Not calendar.readonly,
 * not contacts, not profile beyond the address — asking for more would be
 * asking a specialist to hand over more than the feature uses.
 */
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * Whether to OFFER the connection to specialists.
 *
 * Separate from whether it works. Until Google verifies the app, consent
 * shows an "unverified app" page that uses the word "unsafe" — and a
 * specialist being recruited reads that as a warning about us. The pasted
 * link works and warns nobody, so the convenience is not worth the trust
 * on the side of a marketplace that is hardest to build.
 *
 * Off unless GOOGLE_CONNECT_ENABLED is "true", so it cannot switch itself
 * on by accident. Set that variable once the app is verified.
 *
 * Anyone ALREADY connected keeps working: this hides the invitation, not
 * the feature.
 */
export function isGoogleConnectOffered(): boolean {
  return isGoogleConfigured() && process.env.GOOGLE_CONNECT_ENABLED === "true";
}

export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.NEXT_PUBLIC_SITE_URL,
  );
}

export function redirectUri(): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/api/google/callback`;
}

/**
 * Where to send a specialist to grant access.
 *
 * `state` carries a value we generated and stored, so the callback can tell a
 * real return from a forged one.
 */
export function consentUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    // Without both of these Google returns no refresh token on repeat
    // authorisations, and the connection silently stops working later.
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_ENDPOINT}?${params}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  error?: string;
};

/** The one permission the feature cannot work without. */
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

/** Swaps the one-time code from the callback for a lasting refresh token. */
export async function exchangeCode(
  code: string,
): Promise<
  | { refreshToken: string; accessToken: string }
  | "missing-calendar-scope"
  | null
> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) return null;

  const data = (await response.json()) as TokenResponse;
  if (!data.refresh_token || !data.access_token) return null;

  // Google shows calendar access as a checkbox the person can leave
  // unticked, and still returns a perfectly valid token without it. Storing
  // that token would look like success and then fail silently at the moment
  // a booking is accepted — so refuse it here, where we can still say why.
  const granted = (data.scope ?? "").split(" ");
  if (!granted.includes(CALENDAR_SCOPE)) return "missing-calendar-scope";

  return { refreshToken: data.refresh_token, accessToken: data.access_token };
}

/** Access tokens last an hour; the refresh token is what we keep. */
export async function accessTokenFrom(
  refreshToken: string,
): Promise<string | null> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) return null;

  const data = (await response.json()) as TokenResponse;
  return data.access_token ?? null;
}

export async function googleEmail(accessToken: string): Promise<string | null> {
  const response = await fetch(USERINFO, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { email?: string };
  return data.email ?? null;
}

/**
 * Creates the calendar event and returns the Meet link on it.
 *
 * Returns null on any failure — a revoked token, a network problem, Google
 * declining to attach a conference. The caller falls back to the specialist's
 * pasted link, so a booking is never left with nothing.
 */
export async function createMeetLink({
  refreshToken,
  summary,
  description,
  startsAt,
  endsAt,
  guestEmail,
}: {
  refreshToken: string;
  summary: string;
  description: string;
  startsAt: string;
  endsAt: string;
  guestEmail?: string | null;
}): Promise<string | null> {
  const accessToken = await accessTokenFrom(refreshToken);
  if (!accessToken) return null;

  // requestId must differ per event or Google reuses the previous conference.
  const requestId = crypto.randomUUID();

  const response = await fetch(`${CALENDAR_EVENTS}?conferenceDataVersion=1`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      summary,
      description,
      start: { dateTime: startsAt, timeZone: "Asia/Tehran" },
      end: { dateTime: endsAt, timeZone: "Asia/Tehran" },
      attendees: guestEmail ? [{ email: guestEmail }] : undefined,
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    }),
  });
  if (!response.ok) return null;

  const event = (await response.json()) as {
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  };

  if (event.hangoutLink) return event.hangoutLink;

  // Older responses put it only in entryPoints.
  const video = event.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video",
  );
  return video?.uri ?? null;
}
