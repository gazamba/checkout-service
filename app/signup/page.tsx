import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/features/auth/components/auth-form";
import { getSession } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Sign up · Checkout Service",
};

export default async function SignUpPage() {
  // Secure check (the real boundary): if already signed in, go to checkout.
  const session = await getSession();
  if (session) {
    redirect("/checkout");
  }

  const githubEnabled = Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <AuthForm mode="signup" githubEnabled={githubEnabled} />
    </main>
  );
}
