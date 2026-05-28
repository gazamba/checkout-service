import { redirect } from "next/navigation";

import { getSession } from "@/features/auth/session";

/**
 * Shared session guard for all pages in the (protected) route group. The group
 * name in parens adds no URL segment — children keep their normal paths (e.g.
 * /checkout). This is the secure boundary for UI pages.
 *
 * Note: API routes (e.g. /api/checkout) are NOT children of this layout and
 * must defend themselves with their own session check + 401.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }
  return <>{children}</>;
}
