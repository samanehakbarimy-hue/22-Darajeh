"use client";

import { useState } from "react";
import { setAccountSuspended } from "@/lib/actions/admin";

/**
 * Stopping an account, or letting it go again.
 *
 * Suspending asks first and unsuspending does not, which is the asymmetry that
 * matters: one of them takes somebody's account away mid-sentence, the other
 * hands it back. A confirm on the harmless direction only teaches people to
 * click through confirms.
 *
 * Deliberately not the same control as approving or rejecting a specialist.
 * Rejection is an answer to an application and the specialist reads that word
 * on their own page; this is about an account that was already in good
 * standing, and it applies to seekers too, who have no application at all.
 */
export default function SuspendAccount({
  memberId,
  name,
  suspended,
}: {
  memberId: string;
  name: string;
  suspended: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (suspended) {
    return (
      <form action={setAccountSuspended} className="mt-1">
        <input type="hidden" name="member_id" value={memberId} />
        <input type="hidden" name="suspend" value="false" />
        <button
          type="submit"
          className="py-1.5 text-xs text-brand-deep underline-offset-4 hover:underline"
        >
          رفع تعلیق
        </button>
      </form>
    );
  }

  if (!confirming) {
    return (
      <div className="mt-1">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="py-1.5 text-xs text-muted underline-offset-4 hover:text-danger hover:underline"
        >
          تعلیق حساب
        </button>
      </div>
    );
  }

  return (
    <form action={setAccountSuspended} className="mt-1">
      <input type="hidden" name="member_id" value={memberId} />
      <input type="hidden" name="suspend" value="true" />
      <p className="max-w-[15rem] text-xs leading-5 text-muted">
        حساب {name} معلق شود؟ دیگر نمی‌تواند رزرو کند، پیام بدهد یا نظر بنویسد.
        جلسه‌های قبلی دست‌نخورده می‌مانند.
      </p>
      <div className="mt-1.5 flex items-center gap-3">
        <button
          type="submit"
          className="text-xs font-medium text-danger underline-offset-4 hover:underline"
        >
          بله، معلق کن
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs text-muted hover:text-foreground"
        >
          بی‌خیال
        </button>
      </div>
    </form>
  );
}
