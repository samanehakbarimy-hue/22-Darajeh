export default function Avatar({
  photoUrl,
  name,
  size = 40,
}: {
  photoUrl?: string | null;
  name: string;
  size?: number;
}) {
  const dimension = { width: size, height: size, minWidth: size };

  if (photoUrl) {
    return (
      // Avatars come from Supabase storage and LinkedIn at fixed small sizes,
      // so next/image's optimiser would add a hop without saving anything.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        style={dimension}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={{ ...dimension, fontSize: size * 0.4 }}
      className="flex items-center justify-center rounded-full bg-brand-light font-bold text-brand-deep"
    >
      {name.slice(0, 1)}
    </div>
  );
}
