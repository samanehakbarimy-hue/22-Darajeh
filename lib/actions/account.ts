"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { processAvatar } from "@/lib/images";

export type AccountState = { error?: string; success?: boolean } | undefined;

export async function updateAccount(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "لطفاً دوباره وارد شو." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) {
    return { error: "نام نمی‌تونه خالی باشه." };
  }

  const update: { full_name: string; photo_url?: string } = {
    full_name: fullName,
  };

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 3 * 1024 * 1024) {
      return { error: "حجم عکس باید کمتر از ۳ مگابایت باشد." };
    }
    // Shrunk and re-encoded before it is stored, so the browse page is not
    // asking every visitor to download a full-size phone photo per specialist.
    const processed = await processAvatar(photo);
    if (!processed.ok) {
      return { error: processed.error };
    }

    const path = `${user.id}/avatar.${processed.extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, processed.data, {
        upsert: true,
        contentType: processed.contentType,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    update.photo_url = `${publicUrl}?t=${Date.now()}`;
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_own_account");

  if (error) {
    redirect("/dashboard/account?error=delete_failed");
  }

  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
