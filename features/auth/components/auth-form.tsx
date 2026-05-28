"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signInAction, signInWithGithubAction, signUpAction } from "@/features/auth/actions";

type Mode = "signin" | "signup";

// lucide-react dropped brand icons, so use the official GitHub mark inline.
// The Button sizes bare <svg> children to size-4 automatically.
function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function AuthForm({
  mode,
  githubEnabled,
}: {
  mode: Mode;
  githubEnabled: boolean;
}) {
  const isSignup = mode === "signup";
  // `mode` is fixed per page, so the chosen action is stable across renders.
  const [state, formAction, pending] = useActionState(
    isSignup ? signUpAction : signInAction,
    undefined,
  );

  // Surface auth errors as a toast (they don't redirect, so they're visible on
  // this page); the inline message below stays for accessibility.
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-lg">
          {isSignup ? "Create your account" : "Welcome back"}
        </CardTitle>
        <CardDescription>
          {isSignup
            ? "Sign up to start calculating checkouts."
            : "Sign in to continue to checkout."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={formAction} className="flex flex-col gap-3">
          {isSignup && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" type="text" autoComplete="name" required />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={8}
            />
          </div>

          {state?.error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
            {pending ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>

        {githubEnabled && (
          <>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Separator className="flex-1" />
              or
              <Separator className="flex-1" />
            </div>
            {/* Inline wrapper keeps a clean Promise<void> form-action type. */}
            <form
              action={async () => {
                await signInWithGithubAction();
              }}
            >
              <Button type="submit" variant="outline" size="lg" className="w-full">
                <GithubIcon />
                Continue with GitHub
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <Link
            href={isSignup ? "/signin" : "/signup"}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
