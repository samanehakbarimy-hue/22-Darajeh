"use client";

import { useFormStatus } from "react-dom";
import Spinner from "@/components/Spinner";

const VARIANTS = {
  primary:
    "bg-brand text-background hover:bg-brand-hover disabled:hover:bg-brand",
  outline:
    "border border-card-border text-muted hover:border-brand hover:text-brand disabled:hover:border-card-border disabled:hover:text-muted",
  danger:
    "border border-card-border text-red-400 hover:border-red-400 disabled:hover:border-card-border",
  quiet: "text-muted hover:text-foreground",
} as const;

/**
 * Reads the surrounding form's own pending state, so any form gets a spinner
 * and a locked button without the page having to track it. Pressing something
 * and seeing nothing happen is what makes a site feel broken.
 */
export default function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: keyof typeof VARIANTS;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {pending && <Spinner />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
