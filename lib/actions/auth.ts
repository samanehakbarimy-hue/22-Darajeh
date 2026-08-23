"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      // Without this the confirmation link lands on the site root carrying
      // ?code=..., which nothing exchanges for a session, so the person
      // arrives still logged out.
      emailRedirectTo: `${origin}/auth/callback`,
    },
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

export type ResendState = { error?: string; success?: boolean } | undefined;

export async function resendConfirmation(
  _prevState: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "ایمیلت را وارد کن." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signInWithLinkedIn(role?: "mentor" | "seeker") {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const callbackUrl = role
    ? `${origin}/auth/callback?role=${role}`
    : `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "linkedin_oidc",
    options: { redirectTo: callbackUrl },
  });

  if (error || !data.url) {
    redirect("/login?error=linkedin_failed");
  }

  redirect(data.url);
}

export async function linkLinkedIn() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.linkIdentity({
    provider: "linkedin_oidc",
    options: { redirectTo: `${origin}/auth/callback?next=/dashboard/account` },
  });

  if (error || !data.url) {
    redirect("/dashboard/account?error=link_failed");
  }

  redirect(data.url);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type ResetState = { error?: string; sent?: boolean } | undefined;

/**
 * Sends a link that lets someone back into their own account.
 *
 * Until this existed, forgetting a password was the end of the account: the
 * login page offered no way back and no screen could reset one, so the only
 * remedy was editing auth.users by hand. Reza hit exactly this.
 *
 * The reply is the same whether or not the address has an account. Saying
 * "no account with that email" turns this form into a way of finding out who
 * has registered.
 */
export async function requestPasswordReset(
  _prevState: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "ایمیلت را وارد کن." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  // Recovery arrives as a code, the same as any other OAuth-style return, so
  // it goes through the existing callback and lands on the page that asks for
  // the new password with a session already in hand.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  return { sent: true };
}

/**
 * Sets a new password for whoever is currently signed in.
 *
 * Reached from the recovery link, which signs them in first — the page itself
 * refuses to render without a session, so there is nothing here to abuse.
 */
export async function updatePassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 6) {
    return { error: "رمز عبور باید حداقل ۶ کاراکتر باشد." };
  }
  if (password !== confirm) {
    return { error: "دو رمزی که نوشتی یکی نیستند." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "رمز عبور عوض نشد. یک بار دیگر امتحان کن." };
  }

  redirect("/dashboard?password=changed");
}
