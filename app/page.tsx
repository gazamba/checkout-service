import { redirect } from "next/navigation";

// The app entry point routes into the checkout flow. The proxy + the
// /checkout page's server-side session check send unauthenticated users to
// /signin.
export default function Home() {
  redirect("/checkout");
}
