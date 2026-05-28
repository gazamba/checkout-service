import { redirect } from "next/navigation";

import { getSession } from "@/features/auth/session";

/**
 * Layout for the auth pages (/signin, /signup). If the visitor already has a
 * session there's no point showing sign-in/up, so send them to the checkout.
 * The group name in parens adds no URL segment — pages keep their normal paths.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) {
    redirect("/checkout");
  }
  return <>{children}</>;
}
