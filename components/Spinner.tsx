/**
 * Sized in `em` and coloured by `currentColor`, so it matches whatever text it
 * sits next to without being told.
 */
export default function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em] ${className}`}
      style={{ width: "1em", height: "1em" }}
    />
  );
}
