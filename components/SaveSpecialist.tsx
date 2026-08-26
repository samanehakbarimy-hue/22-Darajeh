import Link from "next/link";
import { toggleSaved } from "@/lib/actions/saved";

/**
 * Keep a specialist for later, and start the conversation.
 *
 * Signed out, both are links to the login page carrying this profile as the
 * destination — the same door the booking button uses, so nobody is asked to
 * sign in and then dumped somewhere else.
 *
 * "Message" asks a question before committing to anything — the thing
 * somebody wants when they are not yet sure this is the right person.
 */
export default function SaveSpecialist({
  specialistId,
  saved,
  signedIn,
  linkedinUrl,
}: {
  specialistId: string;
  saved: boolean;
  signedIn: boolean;
  /** Sits in this row rather than below it: it is one of the same three
      things somebody does here, not a footnote. */
  linkedinUrl?: string | null;
}) {
  const shape =
    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {signedIn ? (
        <form action={toggleSaved}>
          <input type="hidden" name="mentor_id" value={specialistId} />
          <button
            type="submit"
            aria-pressed={saved}
            className={`${shape} ${
              saved
                ? "border-brand bg-brand-light text-brand-deep"
                : "border-card-border text-muted hover:border-brand hover:text-brand-deep"
            }`}
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
            {saved ? "ذخیره شد" : "ذخیره"}
          </button>
        </form>
      ) : (
        <Link
          href={`/login?next=/specialists/${specialistId}`}
          className={`${shape} border-card-border text-muted hover:border-brand hover:text-brand-deep`}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
          </svg>
          ذخیره
        </Link>
      )}

      <Link
        href={`/specialists/${specialistId}/message`}
        className={`${shape} border-card-border text-muted hover:border-brand hover:text-brand-deep`}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 5h16v11H7l-3 3V5Z" />
        </svg>
        پیام
      </Link>

      {/* The mark in its own colour and no ring around it — LinkedIn's badge
          is a known shape, and a grey circle around it made it look like one
          more of our buttons. */}
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="پروفایل لینکدین"
          className="inline-flex items-center p-1 text-[#0A66C2] transition hover:opacity-80"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95C21.6 8.75 22 11 22 14v7h-4v-6.2c0-1.5-.03-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21h-4V9Z" />
          </svg>
        </a>
      )}
    </div>
  );
}
