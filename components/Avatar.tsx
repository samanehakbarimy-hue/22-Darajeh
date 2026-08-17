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
    // eslint-disable-next-line @next/next/no-img-element
    return (
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
      className="flex items-center justify-center rounded-full bg-brand-light font-bold text-brand"
    >
      {name.slice(0, 1)}
    </div>
  );
}
