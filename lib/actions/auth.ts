"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error?: string } | undefined;

async function signUp(
  formData: FormData,
  role: "mentor" | "seeker",
): Promise<AuthFormState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "همه فیلدها الزامی هستند." };
  }
  if (password.length < 6) {
    return { error: "رمز عبور باید حداقل ۶ کاراکتر باشد." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  redirect("/signup/check-email");
}

export async function signUpMentor(
  _prevState: AuthFormState,
  formData: FormData,
) {
  return signUp(formData, "mentor");
}

export async function signUpSeeker(
  _prevState: AuthFormState,
  formData: FormData,
) {
  return signUp(formData, "seeker");
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "ایمیل و رمز عبور را وارد کن." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "ایمیل یا رمز عبور اشتباه است." };
  }

  const next = String(formData.get("next") ?? "").trim();
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
