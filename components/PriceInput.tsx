"use client";

import { useState } from "react";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Everything a person might type or paste, reduced to plain digits. */
export function onlyDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\D/g, "");
}

/** Persian digits, grouped in threes, with any leading zeros dropped. */
export function present(digits: string): string {
  if (!digits) return "";
  const trimmed = digits.replace(/^0+(?=\d)/, "");
  return trimmed
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    .replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/**
 * A price field that reads like a price while it is being typed.
 *
 * Raw digits are genuinely hard to judge: 10000000 and 100000000 differ by a
 * character and by ten times the money, and a stray leading zero survives all
 * the way to the profile. Grouping them as they are entered makes the size of
 * the number obvious at a glance, in the same digits as the suggestion printed
 * underneath.
 *
 * The value is submitted exactly as displayed. The server already accepts
 * Persian and Arabic digits, commas and spaces, so there is nothing to undo
 * here — see toNumber in lib/actions/services.ts.
 */
export default function PriceInput({
  name,
  defaultValue,
  placeholder,
  className,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState(() =>
    present(onlyDigits(defaultValue ?? "")),
  );

  return (
    <input
      name={name}
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={(event) => setValue(present(onlyDigits(event.target.value)))}
      placeholder={placeholder}
      className={className}
    />
  );
}
