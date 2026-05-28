import type { Metadata } from "next";

import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in · Checkout Service",
};

export default function SignInPage() {
  // GitHub is only offered when its env vars are configured (see
  // features/auth/auth.ts); the (auth) layout handles redirecting signed-in users.
  const githubEnabled = Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <AuthForm mode="signin" githubEnabled={githubEnabled} />
    </main>
  );
}
