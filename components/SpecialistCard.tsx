import Link from "next/link";

export type SpecialistCardData = {
  id: string;
  headline?: string | null;
  company?: string | null;
  country?: string | null;
  name: string;
  photoUrl?: string | null;
};

export default function SpecialistCard({
  specialist,
}: {
  specialist: SpecialistCardData;
}) {
  const { id, headline, company, country, name, photoUrl } = specialist;

  return (
    <Link
      href={`/specialists/${id}`}
      className="group flex flex-col rounded-2xl border border-card-border bg-card p-3 text-right transition hover:border-brand focus-visible:border-brand"
    >
      {/* Inset on every side rather than bleeding off the top three edges.
          A photo that runs to the card's corners makes the card look like a
          window onto the photo; framed, it looks like a card with a photo on
          it, and the name below reads as belonging to the same object. The
          padding is on the card, so the text lines up with the photo's edges
          without having to repeat the number. */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-brand-light">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-brand-deep">
            {name.slice(0, 1)}
          </div>
        )}

        {country && (
          <span className="absolute bottom-3 right-3 rounded-full bg-background/85 px-2.5 py-1 text-xs text-foreground backdrop-blur">
            {country}
          </span>
        )}
      </div>

      {/* A name and what they do, and nothing else.
          The expertise chips used to sit under this. They were the same three
          or four words on every card, so they told a reader looking down a
          list nothing that would help them choose — and they are already the
          filters at the top of the page, where they do some work. What
          actually separates one person from another is the job and the place,
          so that is what is left. */}
      <div className="flex flex-1 flex-col pt-3">
        <h3 className="font-bold">{name}</h3>
        {(headline || company) && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {headline}
            {headline && company && " در "}
            {company}
          </p>
        )}
      </div>
    </Link>
  );
}
