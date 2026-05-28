import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { signOutAction } from "@/features/auth/actions";
import { getSession } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Checkout · Checkout Service",
};

export default async function CheckoutPage() {
  // The (protected) layout already enforced the session and redirects if absent;
  // here we just read it for the user's email.
  const session = await getSession();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold">Checkout Service</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{session?.user.email}</span>
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
