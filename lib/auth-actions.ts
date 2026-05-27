"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

/**
 * Shape returned to `useActionState` in the UI (Phase 5). `undefined` means
 * "no error yet"; a populated `error` is rendered next to the form.
 */
export type AuthActionState = { error: string } | undefined;

/** Where users land after a successful sign in / sign up. */
const AFTER_AUTH = "/checkout";

/**
 * Better Auth throws an APIError (which carries `body.message`) on failures
 * like "invalid email or password" or "user already exists". Surface that
 * message; fall back to a generic one otherwise.
 */
function authErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const body = (error as { body?: { message?: string } }).body;
    if (body?.message) return body.message;
    if (error instanceof Error && error.message) return error.message;
  }
  return fallback;
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Name, email, and password are all required." };
  }

  try {
    await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });
  } catch (error) {
    return { error: authErrorMessage(error, "Could not create your account.") };
  }

  // redirect() throws a control-flow exception, so it must run OUTSIDE the
  // try/catch above — otherwise the catch would swallow the redirect.
  redirect(AFTER_AUTH);
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch (error) {
    return { error: authErrorMessage(error, "Invalid email or password.") };
  }

  redirect(AFTER_AUTH);
}

export async function signInWithGithubAction(): Promise<AuthActionState> {
  let url: string | undefined;
  try {
    const result = await auth.api.signInSocial({
      body: { provider: "github", callbackURL: AFTER_AUTH },
      headers: await headers(),
    });
    url = result.url;
  } catch (error) {
    return {
      error: authErrorMessage(error, "GitHub sign-in is not available."),
    };
  }

  if (!url) {
    return { error: "GitHub sign-in is not configured." };
  }
  redirect(url);
}

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/signin");
}
