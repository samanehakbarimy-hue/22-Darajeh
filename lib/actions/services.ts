"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SESSION_TYPES } from "@/lib/services";

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

  let title = "";
  let description = "";
  let minHours: number | null = null;

  if (kind === "consultation") {
    if (!SESSION_TYPES.some((s) => s.key === sessionKey)) {
      return { error: "این جلسه شناخته نشد." };
    }
  } else {
    title = String(formData.get("title") ?? "").trim();
    if (!title) return { error: "عنوان را بنویس." };
    if (title.length > 80) return { error: "عنوان خیلی بلند است." };

    description = String(formData.get("description") ?? "").trim();
    if (description.length > 300) return { error: "توضیح خیلی بلند است." };

    minHours = toNumber(String(formData.get("min_hours") ?? ""));
    if (minHours === null || minHours < 1 || minHours > 200) {
      return { error: "حداقل ساعت را بین ۱ تا ۲۰۰ بنویس." };
    }
  }

  // Left blank on purpose means "not priced yet", which the profile shows as
  // به‌زودی. Zero would mean free, and free is the 22-minute call's job.
  const priceRaw = String(formData.get("price_toman") ?? "").trim();
  const price = priceRaw ? toNumber(priceRaw) : null;
  if (priceRaw && (price === null || price < 0)) {
    return { error: "قیمت را با عدد بنویس." };
  }
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
