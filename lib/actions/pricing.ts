"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

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
  const lo = Number(String(formData.get("min_toman") ?? "").replace(/\D/g, ""));
  const hi = Number(String(formData.get("max_toman") ?? "").replace(/\D/g, ""));

  if (!skey || !level) return { error: "این خانه پیدا نشد." };
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return { error: "عدد معتبر بنویس." };
  }
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
  const granted = Number(
    String(formData.get("granted_toman") ?? "").replace(/\D/g, ""),
  );
  const note = String(formData.get("admin_note") ?? "").trim().slice(0, 500);

  if (!request) return { error: "این درخواست پیدا نشد." };
  if (decision !== "approved" && decision !== "declined") {
    return { error: "جواب معتبر نیست." };
  }
  if (decision === "approved" && (!granted || granted <= 0)) {
    return { error: "برای تأیید باید قیمت مجاز را بنویسی." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_decide_price_request", {
    request,
    decision,
    grant_toman: decision === "approved" ? granted : null,
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
  const asked = Number(
    String(formData.get("asked_toman") ?? "").replace(/[^\d]/g, ""),
  );
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 600);

  if (!sessionKey) return { error: "این جلسه شناخته نشد." };
  if (!asked || asked <= 0) return { error: "قیمتی که می‌خواهی را بنویس." };
  if (!reason) return { error: "بنویس چرا این قیمت را می‌خواهی." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "لطفاً دوباره وارد شو." };

  const { error } = await supabase.from("price_requests").insert({
    mentor_id: user.id,
    session_key: sessionKey,
    asked_toman: asked,
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
