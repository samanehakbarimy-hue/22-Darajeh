"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { getUsdToToman } from "@/lib/exchange-rate";

/**
 * A dollar figure as somebody actually types it.
 *
 * Persian and Arabic digits both reach this from a Persian keyboard, and the
 * decimal separator arrives as a dot, a Persian slash or an Arabic comma
 * depending on the layout. Null means "not a number", which is a different
 * answer from zero and has to stay distinguishable from it.
 */
function toUsd(raw: string): number | null {
  const latin = raw
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[٫،٬]/g, ".")
    .replace(/[$\s,]/g, "")
    .trim();
  if (!latin) return null;
  const n = Number(latin);
  if (!Number.isFinite(n) || n < 0) return null;
  // Cents are as fine as this gets; the database column agrees.
  return Math.round(n * 100) / 100;
}

export type BandState = { error?: string; saved?: boolean } | undefined;

async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("این کار فقط از ادمین برمی‌آید.");
  }
}

/**
 * Sets one cell of the price table: one session type, one experience band.
 *
 * The numbers used to live in lib/seniority.ts as a base dollar rate and a
 * pair of multipliers, which meant changing what a resume review is worth
 * needed a deploy. They are rows now, and this is the only way to write them.
 */
export async function savePriceBand(
  _prev: BandState,
  formData: FormData,
): Promise<BandState> {
  await requireAdmin();

  const skey = String(formData.get("session_key") ?? "");
  const level = String(formData.get("seniority") ?? "");
  const lo = toUsd(String(formData.get("min_usd") ?? ""));
  const hi = toUsd(String(formData.get("max_usd") ?? ""));

  if (!skey || !level) return { error: "این خانه پیدا نشد." };
  if (lo === null || hi === null) {
    return { error: "مبلغ دلاری را با عدد بنویس." };
  }
  if (hi <= 0) return { error: "بیشترین قیمت باید بزرگ‌تر از صفر باشد." };
  if (lo > hi) return { error: "کمینه نمی‌تواند از بیشینه بالاتر باشد." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_price_band", {
    skey,
    level,
    lo,
    hi,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/dashboard/mentor/services");
  return { saved: true };
}

export type DecisionState = { error?: string; saved?: boolean } | undefined;

/**
 * Answers a specialist who asked for a price outside their band.
 *
 * An approval carries the number the admin will actually allow, which need not
 * be the number that was asked for — meeting somebody halfway is a better
 * answer than a flat no, and the form takes it either way.
 */
export async function decidePriceRequest(
  _prev: DecisionState,
  formData: FormData,
): Promise<DecisionState> {
  await requireAdmin();

  const request = String(formData.get("request_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const granted = toUsd(String(formData.get("granted_usd") ?? ""));
  const note = String(formData.get("admin_note") ?? "").trim().slice(0, 500);

  if (!request) return { error: "این درخواست پیدا نشد." };
  if (decision !== "approved" && decision !== "declined") {
    return { error: "جواب معتبر نیست." };
  }
  if (decision === "approved" && (granted === null || granted <= 0)) {
    return { error: "برای تأیید باید قیمت مجاز را به دلار بنویسی." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_decide_price_request", {
    request,
    decision,
    grant_usd: decision === "approved" ? granted : null,
    note: note || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/dashboard/mentor/services");
  return { saved: true };
}

export type AskState = { error?: string; sent?: boolean } | undefined;

/**
 * A specialist asking to charge more than their band allows.
 *
 * Without this the band is just a wall, and a wall only stops the people who
 * were filling the form in honestly. One open ask per service at a time — a
 * unique index sees to that — so this cannot become a way to nag.
 */
export async function requestPriceException(
  _prev: AskState,
  formData: FormData,
): Promise<AskState> {
  const sessionKey = String(formData.get("session_key") ?? "");
  const askedToman = toUsd(String(formData.get("asked_toman") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 600);

  if (!sessionKey) return { error: "این جلسه شناخته نشد." };
  if (askedToman === null || askedToman <= 0) {
    return { error: "قیمتی که می‌خواهی را بنویس." };
  }

  // Asked in toman, stored in dollars. A specialist prices their work in the
  // currency they are paid in, and the band they are asking to step outside of
  // is written in dollars — the conversion has to happen somewhere, and here
  // is the one place that knows both the number and the rate.
  const rate = await getUsdToToman();
  if (rate === null) {
    return { error: "نرخ روز دلار در دسترس نیست. کمی بعد دوباره امتحان کن." };
  }
  const asked = Math.round((askedToman / rate) * 100) / 100;
  if (asked <= 0) return { error: "این عدد خیلی کوچک است." };
  if (!reason) return { error: "بنویس چرا این قیمت را می‌خواهی." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "لطفاً دوباره وارد شو." };

  const { error } = await supabase.from("price_requests").insert({
    mentor_id: user.id,
    session_key: sessionKey,
    asked_usd: asked,
    reason,
  });

  if (error) {
    // The partial unique index is the one refusal worth explaining.
    if (error.code === "23505") {
      return { error: "برای این جلسه یک درخواست باز داری. تا جواب نیامده، دوباره نمی‌شود." };
    }
    return { error: "فرستاده نشد. یک بار دیگر امتحان کن." };
  }

  revalidatePath("/dashboard/mentor/services");
  revalidatePath("/admin");
  return { sent: true };
}
