import Link from "next/link";
import { toggleSaved } from "@/lib/actions/saved";

/**
 * Keep a specialist for later, and start the conversation.
 *
 * Signed out, both are links to the login page carrying this profile as the
 * destination — the same door the booking button uses, so nobody is asked to
 * sign in and then dumped somewhere else.
 *
 * "Message" is deliberately the booking flow rather than a chat box. There is
 * no messaging on this site, and the first message is a 22-minute conversation.
 */
export default function SaveSpecialist({
  specialistId,
  saved,
  signedIn,
  hasSlots,
}: {
  specialistId: string;
  saved: boolean;
  signedIn: boolean;
  hasSlots: boolean;
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
        href={
          hasSlots
            ? `/specialists/${specialistId}/book`
            : `/specialists/${specialistId}/project`
        }
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
    </div>
  );
}
