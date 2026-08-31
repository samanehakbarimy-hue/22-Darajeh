import Link from "next/link";

/**
 * One specialist on the browse page.
 *
 * Wide and horizontal rather than the square card the homepage uses, because
 * this page is a list somebody reads down to choose from: the photo anchors
 * the row, the middle carries everything that separates one person from
 * another, and the foot carries the price and the way in. The homepage keeps
 * SpecialistCard, where four of them sit side by side and there is no room
 * for any of this.
 *
 * Every field is optional and every one of them is real. Nothing here is
 * filled in with a placeholder when the database has nothing to say — a row
 * with no reviews shows no rating rather than a grey zero, because an empty
 * five stars reads as a bad score.
 */
export type SpecialistRowData = {
  id: string;
  name: string;
  photoUrl?: string | null;
  headline?: string | null;
  company?: string | null;
  country?: string | null;
  bio?: string | null;
  /** Skills first, then fields of expertise — deduped by the page. */
  tags: string[];
  seniority?: string | null;
  /** Sessions actually held. Zero means the row is left off. */
  heldSessions: number;
  rating: { average: number; count: number } | null;
  /** The cheapest paid session, already formatted. Free call aside. */
  startingPrice: string | null;
  /** The next unbooked slot, as a day. */
  nextSlotLabel: string | null;
};

function Stars({ average }: { average: number }) {
  return (
    <span aria-hidden className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((step) => (
        <svg
          key={step}
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 ${
            step <= Math.round(average) ? "text-warning" : "text-card-border"
          }`}
          fill="currentColor"
        >
          <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-.9z" />
        </svg>
      ))}
    </span>
  );
}

export default function SpecialistRow({
  specialist,
}: {
  specialist: SpecialistRowData;
}) {
  const {
    id,
    name,
    photoUrl,
    headline,
    company,
    country,
    bio,
    tags,
    seniority,
    heldSessions,
    rating,
    startingPrice,
    nextSlotLabel,
  } = specialist;

  // Five is what fits on one line at the narrowest desktop column. The rest
  // become a count, so a specialist who listed twenty does not push the price
  // off the bottom of the screen.
  const shown = tags.slice(0, 5);
  const spare = tags.length - shown.length;

  const facts = [country, seniority].filter(Boolean) as string[];

  return (
    // The whole row is the link. The button in the foot is a span inside it —
    // an anchor there would nest, and two targets to the same page is one
    // more than anybody needs.
    <Link
      href={`/specialists/${id}`}
      className="group block overflow-hidden rounded-2xl border border-card-border bg-card transition hover:border-brand hover:shadow-sm focus-visible:border-brand"
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:gap-5">
        <div className="shrink-0">
          <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-brand-light sm:h-32 sm:w-32">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-brand-deep">
                {name.slice(0, 1)}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-lg font-bold leading-7 transition group-hover:text-brand-deep">
              {name}
            </h3>
            {rating && (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Stars average={rating.average} />
                <span className="font-medium text-foreground">
                  {rating.average.toLocaleString("fa-IR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </span>
                <span>({rating.count.toLocaleString("fa-IR")} نظر)</span>
              </span>
            )}
          </div>

          {(headline || company) && (
            <p className="mt-1 text-sm leading-6 text-brand-deep">
              {headline}
              {headline && company && " در "}
              {company}
            </p>
          )}

          {(facts.length > 0 || heldSessions > 0) && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              {facts.map((fact, index) => (
                <span key={fact} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden>·</span>}
                  {fact}
                </span>
              ))}
              {heldSessions > 0 && (
                <span className="flex items-center gap-2">
                  {facts.length > 0 && <span aria-hidden>·</span>}
                  {heldSessions.toLocaleString("fa-IR")} گفت‌وگوی انجام‌شده
                </span>
              )}
            </p>
          )}

          {bio && (
            <p className="mt-2.5 line-clamp-2 text-sm leading-6 text-muted">
              {bio}
            </p>
          )}

          {shown.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {shown.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-brand-light px-2.5 py-1 text-xs text-brand-deep"
                >
                  {tag}
                </li>
              ))}
              {spare > 0 && (
                <li className="rounded-full px-1.5 py-1 text-xs text-muted">
                  +{spare.toLocaleString("fa-IR")}
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* The foot: what it costs and the way in, on the tinted strip the
          profile's booking panel uses for the same job. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border bg-brand-light/40 px-5 py-4">
        <div className="min-w-0">
          <div className="text-sm font-bold text-brand-deep">
            گفت‌وگوی ۲۲ دقیقه‌ای رایگان
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            {startingPrice && <span>جلسات تخصصی از {startingPrice}</span>}
            {startingPrice && nextSlotLabel && <span aria-hidden>·</span>}
            {nextSlotLabel && <span>نزدیک‌ترین زمان: {nextSlotLabel}</span>}
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-booking px-5 py-2.5 text-sm font-semibold text-booking-on transition group-hover:bg-booking-hover">
          مشاهده پروفایل
        </span>
      </div>
    </Link>
  );
}
