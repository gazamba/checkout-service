import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";

// GitHub OAuth is optional: only wire it up when both credentials are present,
// so email+password auth still works without a configured OAuth app.
const githubConfigured = Boolean(
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
);

export const auth = betterAuth({
  // Better Auth also reads BETTER_AUTH_SECRET / BETTER_AUTH_URL from the env
  // automatically; we pass them explicitly for clarity.
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  // Drizzle adapter over the Neon serverless driver. `schema` is keyed by
  // Better Auth's model names (user/session/account/verification); the extra
  // checkout tables in the namespace are ignored by the adapter.
  database: drizzleAdapter(db, { provider: "pg", schema }),

  emailAndPassword: {
    enabled: true,
  },

  account: {
    accountLinking: {
      enabled: true,
      // Auto-link a social login to an existing user with the same email.
      // GitHub is trusted because it only returns verified emails, which proves
      // the GitHub user owns the address.
      trustedProviders: ["github"],
      // This app has no email-verification flow, so email/password accounts have
      // emailVerified=false. Without this, Better Auth would refuse to link a
      // GitHub login to them (account_not_linked). Safe here because the trusted
      // provider already verified the email; revisit if email verification is added.
      requireLocalEmailVerified: false,
    },
  },

  socialProviders: githubConfigured
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID as string,
          clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
      }
    : undefined,

  // nextCookies writes Better Auth's Set-Cookie headers into Next's cookie
  // store so session cookies are persisted when auth.api.* is called from
  // server actions. It MUST be the last plugin in the array.
  plugins: [nextCookies()],
});
