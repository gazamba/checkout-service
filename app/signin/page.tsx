import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Sign in · Checkout Service",
};

// Note: the sign-up flow lives at /signup (see app/signup/page.tsx).

export default async function SignInPage() {
  // Secure check (the real boundary): if already signed in, go to checkout.
  // The proxy also does this optimistically, but we never rely on it alone.
  const session = await getSession();
  if (session) {
    redirect("/checkout");
  }

  // GitHub OAuth is only wired up when its env vars are set (see lib/auth.ts),
  // so only offer the button when it will actually work.
  const githubEnabled = Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <AuthForm mode="signin" githubEnabled={githubEnabled} />
    </main>
  );
}
