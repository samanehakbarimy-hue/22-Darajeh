"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">یک مشکلی پیش اومد</h1>
      <p className="mt-3 leading-7 text-muted">
        از سمت ما بود، نه تو. دوباره امتحان کن؛ اگر باز هم تکرار شد بهمون خبر
        بده.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-background hover:bg-brand-dark"
        >
          دوباره امتحان کن
        </button>
        <Link
          href="/"
          className="rounded-full border border-card-border px-6 py-3 text-sm font-medium hover:bg-card"
        >
          صفحه اصلی
        </Link>
      </div>

      {/* The digest is what identifies this crash in the logs, so it is worth
          showing when someone reports it. */}
      {error.digest && (
        <p className="mt-8 text-xs text-muted/60" dir="ltr">
          {error.digest}
        </p>
      )}
    </div>
  );
}
