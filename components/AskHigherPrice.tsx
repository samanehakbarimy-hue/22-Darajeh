"use client";

import { useActionState, useState } from "react";
import { requestPriceException } from "@/lib/actions/pricing";
import { floorToman, formatTomanApprox, formatUsdApprox } from "@/lib/rates";

type Ask = {
  status: "pending" | "approved" | "declined";
  asked_usd: number;
  granted_usd: number | null;
  admin_note: string | null;
};

/**
 * A stored dollar figure, said in the currency the specialist is paid in.
 *
 * Toman leads because that is what they will actually charge; the dollar
 * follows because that is the number the rule is written in, and a ceiling
 * quoted in toman alone would look like it moved on its own every week.
 */
function inBoth(usd: number, rate: number | null): string {
  if (!rate) return formatUsdApprox(usd);
  return `${formatTomanApprox(usd * rate)} (${formatUsdApprox(usd)})`;
}

/**
 * The same, for a figure that is a ceiling rather than an amount.
 *
 * Rounded down, always. An allowance of $9.70 comes to 1,998,297 toman, and
 * saying «۲٬۰۰۰٬۰۰۰ تومان» would invite a specialist to type exactly that and
 * be refused at $9.71 by the allowance that just quoted it.
 */
function ceilingInBoth(usd: number, rate: number | null): string {
  if (!rate) return formatUsdApprox(usd);
  const toman = floorToman(usd * rate).toLocaleString("fa-IR");
  return `${toman} تومان (${formatUsdApprox(usd)})`;
}

/**
 * Asking to charge more than the band allows.
 *
 * Folded away until wanted, because most people will price inside the range
 * and a form asking "why should you be an exception?" open on every service is
 * an invitation to feel like one.
 *
 * It insists on a reason. An admin looking at a number with no argument
 * attached can only guess, and guessing is how this becomes arbitrary.
 *
 * The figure is typed in toman and stored in dollars. A specialist prices
 * their work in the currency they are paid in; the band they are asking to
 * step outside of is written in dollars — see requestPriceException, which is
 * the one place that knows both.
 */
export default function AskHigherPrice({
  sessionKey,
  title,
  ceilingUsd,
  usdRate,
  existing,
}: {
  sessionKey: string;
  title: string;
  /** The most they may charge today without asking, in dollars. */
  ceilingUsd: number | null;
  /** Toman per dollar, for saying that ceiling in the currency they charge. */
  usdRate: number | null;
  existing: Ask | null;
}) {
  const [state, action, pending] = useActionState(
    requestPriceException,
    undefined,
  );
  const [open, setOpen] = useState(false);

  if (existing?.status === "pending" && !state?.sent) {
    return (
      <p className="mt-2 text-xs leading-6 text-muted">
        درخواست {inBoth(existing.asked_usd, usdRate)} ثبت شده و در حال بررسی
        است.
      </p>
    );
  }

  if (existing?.status === "approved" && existing.granted_usd) {
    return (
      <p className="mt-2 text-xs leading-6 text-success">
        سقف قیمت این جلسه {ceilingInBoth(existing.granted_usd, usdRate)} تعیین
        شد.
        {existing.admin_note ? ` ${existing.admin_note}` : ""}
      </p>
    );
  }

  if (state?.sent) {
    return (
      <p className="mt-2 text-xs text-success">
        درخواست ثبت شد. نتیجه بررسی همین‌جا نمایش داده می‌شود.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="mt-2">
        {existing?.status === "declined" && (
          <p className="mb-1 text-xs text-muted">
            درخواست قبلی تأیید نشد.
            {existing.admin_note ? ` ${existing.admin_note}` : ""}
          </p>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-brand-deep underline-offset-4 hover:underline"
        >
          درخواست بررسی قیمت
        </button>
      </div>
    );
  }

  // Rounded down, so the number quoted here is always one the band would
  // actually accept rather than a hair above its own ceiling.
  const ceilingLine =
    ceilingUsd && usdRate
      ? ` بیشترین قیمت فعلی ${floorToman(ceilingUsd * usdRate).toLocaleString(
          "fa-IR",
        )} تومان (${formatUsdApprox(ceilingUsd)}) است.`
      : ceilingUsd
        ? ` بیشترین قیمت فعلی ${formatUsdApprox(ceilingUsd)} است.`
        : "";

  return (
    <form action={action} className="mt-2 rounded-xl border border-card-border p-3">
      <input type="hidden" name="session_key" value={sessionKey} />

      <p className="text-xs leading-6 text-muted">
        برای «{title}»{ceilingLine}
      </p>

      <label className="mt-2 block text-xs text-muted" htmlFor={`ask-${sessionKey}`}>
        قیمت پیشنهادی (تومان)
      </label>
      <input
        id={`ask-${sessionKey}`}
        name="asked_toman"
        inputMode="numeric"
        required
        className="mt-1 w-40 rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-brand-deep"
      />

      <label className="mt-2.5 block text-xs text-muted" htmlFor={`why-${sessionKey}`}>
        دلیل درخواست
      </label>
      <textarea
        id={`why-${sessionKey}`}
        name="reason"
        rows={3}
        required
        maxLength={600}
        placeholder="تجربه یا تخصصی که این جلسه را متفاوت می‌کند."
        className="mt-1 w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm leading-6 outline-none focus:border-brand-deep"
      />

      {state?.error && <p className="mt-2 text-xs text-danger">{state.error}</p>}

      <div className="mt-2.5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-brand-on hover:bg-brand-hover disabled:opacity-60"
        >
          ثبت درخواست
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted hover:text-foreground"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}
