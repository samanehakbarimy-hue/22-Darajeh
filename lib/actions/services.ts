"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SESSION_TYPES } from "@/lib/services";
import {
  MAX_PRICE_TOMAN,
  roundEnteredPrice,
  displayToman,
  ceilToman,
  floorToman,
  formatUsdApprox,
} from "@/lib/rates";
import { getUsdToToman } from "@/lib/exchange-rate";

export type ServiceState = { error?: string; success?: boolean } | undefined;

const KINDS = ["consultation", "hourly_project"] as const;
type Kind = (typeof KINDS)[number];

/**
 * Persian digits arrive from Persian keyboards, and people type separators.
 * "۸۰۰٬۰۰۰" and "800,000" both mean the same number.
 */
function toNumber(raw: string): number | null {
  const latin = raw
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,،٬\s]/g, "")
    .trim();
  if (!latin) return null;
  const n = Number(latin);
  return Number.isFinite(n) ? n : null;
}

export async function saveService(
  _prev: ServiceState,
  formData: FormData,
): Promise<ServiceState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "لطفاً دوباره وارد شو." };

  const id = String(formData.get("id") ?? "").trim();
  const kind = String(formData.get("kind") ?? "") as Kind;
  if (!KINDS.includes(kind)) return { error: "نوع خدمت نامعتبر است." };

  // A session is one of the fixed catalogue entries: its title, description
  // and length come from code, and the specialist sets only a price. Project
  // work is theirs to describe, so it is validated the old way.
  const sessionKey = String(formData.get("session_key") ?? "").trim();

  const title = "";
  const description = "";
  const minHours: number | null = null;

  if (kind === "consultation") {
    if (!SESSION_TYPES.some((s) => s.key === sessionKey)) {
      return { error: "این جلسه شناخته نشد." };
    }
  }
  // Project work carries no title or description any more: the specialist
  // states a rate, and the work itself is described by whoever is asking.

  // Left blank on purpose means "not priced yet", which the profile shows as
  // به‌زودی. Zero would mean free, and free is the 22-minute call's job.
  const negotiable =
    kind === "hourly_project" && formData.get("is_negotiable") !== null;

  const priceRaw = String(formData.get("price_toman") ?? "").trim();
  // Negotiable is a deliberate absence of a number, so any figure typed before
  // the box was ticked is dropped rather than stored beside it — the database
  // refuses to hold both, and the profile would have two answers to one
  // question.
  const parsed = negotiable ? null : priceRaw ? toNumber(priceRaw) : null;
  if (!negotiable && priceRaw && (parsed === null || parsed < 0)) {
    return { error: "قیمت را با عدد بنویس." };
  }

  // Rounded to the nearest thousand. ۲۲٬۰۲۰٬۲۱۳ is not a decision anybody
  // made, it is a slip, and it reads like one on a public profile. Nothing in
  // this market is priced to the Toman, so the last digits carry no meaning.
  if (parsed !== null && parsed > MAX_PRICE_TOMAN) {
    return { error: "این عدد خیلی بزرگ است. مطمئنی تعداد صفرها درست است؟" };
  }

  const price = parsed === null ? null : roundEnteredPrice(parsed);
  // The rate the job last recorded. Null means it has never run or its source
  // was unreachable, in which case the toman figure is stored as typed and the
  // job will fill the dollars in when it can.
  const rate = await getUsdToToman();
  const priceUsd =
    price !== null && price > 0 && rate !== null
      ? Math.round((price / rate) * 100) / 100
      : null;

  const row = {
    mentor_id: user.id,
    kind,
    session_key: kind === "consultation" ? sessionKey : null,
    title,
    description,
    // Length is the catalogue's for a session, and irrelevant to a project.
    minutes: null,
    min_hours: minHours,
    // Toman is what they typed; dollars is what gets kept. The daily job
    // re-renders price_toman from price_usd, so storing only the toman figure
    // would mean the next run overwrote it with a conversion of nothing.
    //
    // Rounded on the way in as well, so what they see after saving is the same
    // number the job would have produced — otherwise a price looks fine today
    // and shifts by itself overnight for no reason anybody can see.
    price_usd: priceUsd,
    price_toman: priceUsd === null ? price : displayToman(priceUsd, rate),
    is_negotiable: negotiable,
    is_active: formData.get("is_active") !== null,
  };

  // RLS scopes both paths to this specialist, so an id from elsewhere updates
  // nothing rather than someone else's row.
  const { error } = id
    ? await supabase
        .from("mentor_services")
        .update(row)
        .eq("id", id)
        .eq("mentor_id", user.id)
    : await supabase.from("mentor_services").insert(row);

  if (error) {
    // The table only exists once 0019 has been applied.
    if (error.code === "42P01") {
      return { error: "جدول خدمات هنوز ساخته نشده. مهاجرت ۰۰۱۹ را اجرا کن." };
    }

    // The band trigger raises PRICE_ABOVE_BAND:<usd> / PRICE_BELOW_BAND:<usd>,
    // carrying the limit it broke. Saying "outside the range" without saying
    // what the range is leaves somebody guessing at a number.
    //
    // The limit arrives in dollars, because that is what the band is written
    // in since 0055, and is said back in toman, because that is what they just
    // typed. A ceiling rounds down and a floor rounds up, so the figure quoted
    // is always one this same rule would accept — quoting a ceiling of
    // 550,047 as 600,000 would send somebody straight back into the error.
    const band = /PRICE_(ABOVE|BELOW)_BAND:([\d.]+)/.exec(error.message ?? "");
    if (band) {
      const above = band[1] === "ABOVE";
      const limitUsd = Number(band[2]);
      const limit =
        rate !== null && Number.isFinite(limitUsd)
          ? `${(above ? floorToman(limitUsd * rate) : ceilToman(limitUsd * rate)).toLocaleString("fa-IR")} تومان (${formatUsdApprox(limitUsd)})`
          : formatUsdApprox(limitUsd);

      return {
        error: above
          ? `این قیمت بالاتر از بازه جاب‌آموز است. بیشترین قیمت مجاز ${limit} است. برای قیمت بالاتر، از همین صفحه درخواست بررسی ثبت کن.`
          : `این قیمت پایین‌تر از بازه جاب‌آموز است. کمترین قیمت مجاز ${limit} است.`,
      };
    }

    return { error: "ذخیره نشد. یک بار دیگر امتحان کن." };
  }

  revalidatePath("/dashboard/mentor/services");
  revalidatePath(`/specialists/${user.id}`);
  return { success: true };
}

export async function deleteService(
  _prev: ServiceState,
  formData: FormData,
): Promise<ServiceState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "لطفاً دوباره وارد شو." };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "خدمت پیدا نشد." };

  const { error } = await supabase
    .from("mentor_services")
    .delete()
    .eq("id", id)
    .eq("mentor_id", user.id);

  if (error) return { error: "حذف نشد. یک بار دیگر امتحان کن." };

  revalidatePath("/dashboard/mentor/services");
  revalidatePath(`/specialists/${user.id}`);
  return { success: true };
}
