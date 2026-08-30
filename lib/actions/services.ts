"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SESSION_TYPES } from "@/lib/services";
import { MAX_PRICE_TOMAN, roundEnteredPrice } from "@/lib/rates";

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
  const row = {
    mentor_id: user.id,
    kind,
    session_key: kind === "consultation" ? sessionKey : null,
    title,
    description,
    // Length is the catalogue's for a session, and irrelevant to a project.
    minutes: null,
    min_hours: minHours,
    price_toman: price,
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

    // The band trigger raises PRICE_ABOVE_BAND:<n> / PRICE_BELOW_BAND:<n>,
    // carrying the limit it broke. Saying "outside the range" without saying
    // what the range is leaves somebody guessing at a number.
    const band = /PRICE_(ABOVE|BELOW)_BAND:(\d+)/.exec(error.message ?? "");
    if (band) {
      const limit = Number(band[2]).toLocaleString("fa-IR");
      return {
        error:
          band[1] === "ABOVE"
            ? `این قیمت بالاتر از بازه جاب‌آموز است. بیشترین قیمت مجاز ${limit} تومان است. برای قیمت بالاتر، از همین صفحه درخواست بررسی ثبت کن.`
            : `این قیمت پایین‌تر از بازه جاب‌آموز است. کمترین قیمت مجاز ${limit} تومان است.`,
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
