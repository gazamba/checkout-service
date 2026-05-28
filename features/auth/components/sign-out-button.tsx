"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await signOutAction();
          toast.success("Signed out");
          // Client navigation keeps the toast visible (the Toaster lives in the
          // root layout, which persists across the route change).
          router.replace("/signin");
        })
      }
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
