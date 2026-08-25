import Link from "next/link";

export type SpecialistCardData = {
  id: string;
  headline?: string | null;
  country?: string | null;
  expertise_tags?: string[] | null;
  name: string;
  photoUrl?: string | null;
};

export default function SpecialistCard({
  specialist,
  maxTags = 3,
}: {
  specialist: SpecialistCardData;
  maxTags?: number;
}) {
  const { id, headline, country, name, photoUrl } = specialist;
  const allTags = specialist.expertise_tags ?? [];
  const tags = allTags.slice(0, maxTags);
  // Dropping the rest silently made a specialist look narrower than they are:
  // four fields went in and three came out with nothing to say so.
  const hiddenTags = allTags.length - tags.length;

  return (
    <Link
      href={`/specialists/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card text-right transition hover:border-brand focus-visible:border-brand"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-brand-light">
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

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold">{name}</h3>
        {headline && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{headline}</p>
        )}

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-brand-light px-2.5 py-1 text-xs text-brand-deep"
              >
                {tag}
              </span>
            ))}
            {hiddenTags > 0 && (
              <span className="rounded-full px-2.5 py-1 text-xs text-muted">
                +{hiddenTags.toLocaleString("fa-IR")}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
