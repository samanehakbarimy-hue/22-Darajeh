"use client";

import Link, { useLinkStatus } from "next/link";
import Spinner from "@/components/Spinner";

function Indicator() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner className="text-current" /> : null;
}

/**
 * A link that admits it was clicked. Navigation to a dynamic route can take a
 * moment, and without this the page simply sits there looking ignored.
 */
export default function PendingLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 transition active:scale-[0.98] ${className}`}
    >
      {children}
      <Indicator />
    </Link>
  );
}
