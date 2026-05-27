import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CheckoutForm } from "@/components/checkout-form";
import { signOutAction } from "@/lib/auth-actions";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Checkout · Checkout Service",
};

export default async function CheckoutPage() {
  // SECURE check — the real authorization boundary (the proxy is only optimistic).
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold">Checkout Service</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{session.user.email}</span>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <CheckoutForm />
      </main>
    </div>
  );
}
