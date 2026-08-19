/** A block standing in for content that has not arrived yet. */
export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-lg bg-card-border/60 ${className}`}
    />
  );
}
