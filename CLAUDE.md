@AGENTS.md

# Checkout Service — project context

Authenticated checkout calculator (a take-home challenge). A single endpoint
computes subtotal/taxes/discount/total, persists every calculation, requires
authentication, and is designed to run **statelessly in a distributed
architecture**. A bonus UI is included.

## Stack

- **Next.js 16** (App Router) + TypeScript — has **breaking changes vs. older
  Next** (see AGENTS.md): `middleware` is now `proxy.ts`; `cookies()`/`headers()`
  are async; route handlers in `app/**/route.ts`.
- **Neon** serverless Postgres via the `@neondatabase/serverless` **HTTP** driver.
- **Drizzle ORM** + `drizzle-kit` (migrations).
- **Better Auth** (Drizzle adapter): email/password **and** GitHub OAuth; sign
  up/in/out are **server actions**; `nextCookies` plugin (must be last).
- **shadcn/ui** (Base UI preset) + **Tailwind v4**. `lucide-react` has no brand
  icons (GitHub mark is an inline SVG).
- **Vitest** for unit tests. Deployed on **Vercel**.

## Commands

- `pnpm dev | build | start | lint | test`
- `pnpm db:generate | db:migrate | db:push | db:studio` — drizzle-kit; loads
  `.env*` via `@next/env`. `db:generate` works offline; the others need
  `DATABASE_URL`.

## Key files

- `lib/checkout.ts` — **pure** calc in integer cents (+ `lib/checkout.test.ts`).
- `app/api/checkout/route.ts` — `POST /api/checkout`: session 401 → Zod 400 →
  calc → atomic `db.batch` persist → `201` with 2-decimal numbers.
- `lib/auth.ts` (Better Auth config), `db/index.ts` (Neon HTTP Drizzle client),
  `db/schema.ts` (schema), `lib/auth-actions.ts` (server actions),
  `lib/session.ts` (`getSession` helper).
- `app/signin` + `app/signup` (separate pages, cross-linked), `app/checkout`
  (auth-gated UI), `proxy.ts` (optimistic cookie-only auth redirects).

## Money model — intentional, do NOT "fix"

- Compute and store in **integer cents**; convert dollars↔cents only at the
  edges (`toCents`/`toAmount` in `lib/checkout.ts`). Money DB columns are `integer`.
- `taxes = 13%` of the **full** subtotal (before discount).
- `discount = 10%` only when subtotal is **strictly > $100.00** (10000 cents);
  exactly $100.00 → no discount.
- API returns numbers rounded to 2 decimals; the UI formats with `toFixed(2)`.

## Conventions / gotchas

- **No interactive transactions** on the Neon HTTP driver — it throws. Use
  `db.batch([...])` for atomic multi-writes and generate ids app-side
  (`crypto.randomUUID()`) since batch can't use intermediate results.
- **Better Auth + Drizzle schema rules:** export tables under singular model
  names (`user`/`session`/`account`/`verification`); object **property keys**
  must equal Better Auth's camelCase field names; SQL column names are snake_case.
- **Security boundary is server-side** (`getSession()` in pages, `401` in the
  API). `proxy.ts` is **optimistic only** (cookie presence), never the boundary.
- **GitHub account linking** is enabled with `requireLocalEmailVerified: false`
  (this MVP has no email-verification flow) so GitHub logins merge into an
  existing same-email account. Revisit if email verification is ever added.

## Environment (`.env.local`; documented in `.env.example`)

- `DATABASE_URL` (Neon **pooled** string), `BETTER_AUTH_SECRET`,
  `BETTER_AUTH_URL` (full origin, **no trailing slash**),
  `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` (optional).
- `.env.local` is git-ignored; only `.env.example` (placeholders) is committed.
- **Vercel:** set these in the **Production** scope and **redeploy** (env changes
  only apply to new deployments). A bad `BETTER_AUTH_URL` (e.g. the literal
  `"pending"`) makes Better Auth throw at init → 500s on every `getSession`
  route while the proxy still works. GitHub OAuth callback:
  `https://<prod>/api/auth/callback/github`. Local and prod share one Neon DB.

## Verifying changes

- Run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build`, and `pnpm test`.
- For runtime checks, smoke-test against a running server (sign up → cookie →
  `POST /api/checkout`) and clean up any test users afterward (FK cascade
  removes their sessions/accounts/checkouts).
