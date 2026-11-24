"use server";

import { redirect } from "next/navigation";

import {
  buildAuthSiteUrl,
} from "@/lib/auth/authSiteUrl";
import { getLearnerIdentity } from "@/lib/auth/learnerIdentity";
import { accountHref, type AccountLocale } from "@/lib/auth/accountLocale";
import { createServerAuthClient } from "@/lib/supabase/authServer";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const MIN_NEW_PASSWORD_LENGTH = 8;

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function formLocale(formData: FormData): AccountLocale {
  return formString(formData, "uiLang") === "vi" ? "vi" : "en";
}
function authPath(path: string, locale: AccountLocale, query: string) {
  const url = accountHref(path, locale);
  return url + (url.includes("?") ? "&" : "?") + query;
}

function validEmail(value: string) {
  const email = value.trim();
  return email.length > 0
    && email.length <= MAX_EMAIL_LENGTH
    && email.includes("@");
}

function validExistingPassword(value: string) {
  return value.length > 0 && value.length <= MAX_PASSWORD_LENGTH;
}

function validNewPassword(value: string) {
  return value.length >= MIN_NEW_PASSWORD_LENGTH
    && value.length <= MAX_PASSWORD_LENGTH;
}

export async function loginLearner(formData: FormData) {
  const email = formString(formData, "email").trim();
  const password = formString(formData, "password");

  if (!validEmail(email) || !validExistingPassword(password)) {
    redirect(authPath("/login", formLocale(formData), "error=invalid"));
  }

  const supabase = await createServerAuthClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(authPath("/login", formLocale(formData), "error=credentials"));
  }

  redirect(accountHref("/account", formLocale(formData)));
}

export async function signupLearner(formData: FormData) {
  const email = formString(formData, "email").trim();
  const password = formString(formData, "password");
  const confirmPassword = formString(formData, "confirmPassword");

  if (
    !validEmail(email)
    || !validNewPassword(password)
    || password !== confirmPassword
  ) {
    redirect(authPath("/signup", formLocale(formData), "error=invalid"));
  }

  let emailRedirectTo: string;
  try {
    emailRedirectTo = buildAuthSiteUrl("/auth/confirm", {
      next: "/account",
      uiLang: formLocale(formData),
    });
  } catch {
    redirect(authPath("/signup", formLocale(formData), "error=configuration"));
  }

  const supabase = await createServerAuthClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    redirect(authPath("/signup", formLocale(formData), "error=signup"));
  }

  if (data.session) {
    redirect(accountHref("/account", formLocale(formData)));
  }

  redirect(authPath("/login", formLocale(formData), "check_email=1"));
}

export async function requestPasswordReset(formData: FormData) {
  const email = formString(formData, "email").trim();

  if (!validEmail(email)) {
    redirect(authPath("/forgot-password", formLocale(formData), "error=invalid"));
  }

  let redirectTo: string;
  try {
    redirectTo = buildAuthSiteUrl("/auth/confirm", {
      next: "/reset-password",
      uiLang: formLocale(formData),
    });
  } catch {
    redirect(authPath("/forgot-password", formLocale(formData), "error=configuration"));
  }

  const supabase = await createServerAuthClient();

  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
  } catch {
    // Keep recovery responses account-enumeration resistant.
  }

  redirect(authPath("/forgot-password", formLocale(formData), "sent=1"));
}

export async function updateLearnerPassword(formData: FormData) {
  const password = formString(formData, "password");
  const confirmPassword = formString(formData, "confirmPassword");

  if (!validNewPassword(password) || password !== confirmPassword) {
    redirect(authPath("/reset-password", formLocale(formData), "error=invalid"));
  }

  const identity = await getLearnerIdentity();
  if (!identity) {
    redirect(authPath("/login", formLocale(formData), "error=session"));
  }

  const supabase = await createServerAuthClient();
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(authPath("/reset-password", formLocale(formData), "error=update"));
  }

  redirect(authPath("/account", formLocale(formData), "password_updated=1"));
}
