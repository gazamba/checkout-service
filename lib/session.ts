import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/**
 * Reads the current Better Auth session on the server (Server Components,
 * Server Actions, Route Handlers). Returns `{ session, user }` or `null`.
 *
 * Importing `next/headers` makes this module server-only; it cannot be used
 * from a Client Component.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Convenience: the current user, or `null` if unauthenticated. */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
