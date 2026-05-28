# Checkout Service

A small, authenticated checkout calculator built with the Next.js App Router.
Given a list of line items it computes subtotal, taxes, and an optional discount,
persists every calculation, and returns the totals as JSON.

**Live demo:** https://checkout-service-seven.vercel.app

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Neon** (serverless Postgres) via the `@neondatabase/serverless` HTTP driver
- **Drizzle ORM** + `drizzle-kit` for schema and migrations
- **Better Auth** (Drizzle adapter) — email/password **and** GitHub OAuth, with
  sign up / sign in / sign out implemented as **server actions**
- **shadcn/ui** (Tailwind v4) for the interface
- **Vitest** for unit tests

## Business logic

Implemented as a pure, side-effect-free function in [`features/checkout/calculate.ts`](features/checkout/calculate.ts).
All money is computed in **integer cents** to avoid floating-point drift.

```
subtotal = Σ (unit_price × quantity)
taxes    = 13% of subtotal        (computed on the FULL subtotal, before discount)
discount = 10% of subtotal        (only when subtotal is strictly greater than $100.00)
total    = subtotal + taxes − discount
```

Two intentional rules (per spec):

- Taxes are charged on the full subtotal, **not** the discounted amount.
- The discount threshold is **strictly greater than** $100.00 — exactly $100.00 gets no discount.

The API returns the four amounts as numbers rounded to 2 decimals; the UI formats
them as `"10.99"`.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (`corepack enable` or `npm i -g pnpm`)
- A [Neon](https://neon.tech) Postgres database (free tier is fine)

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill in the values (see below)
pnpm db:migrate              # apply the schema to your Neon database
pnpm dev                     # http://localhost:3000
```

### Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon Postgres connection string. Prefer the **pooled** string (host contains `-pooler`) since the runtime uses the serverless driver. |
| `BETTER_AUTH_SECRET` | ✅ | Long random string used to sign/encrypt sessions. Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | ✅ | Base URL of the app. `http://localhost:3000` for local dev. |
| `GITHUB_CLIENT_ID` | optional | GitHub OAuth app client id. Only needed for "Continue with GitHub"; email/password works without it. |
| `GITHUB_CLIENT_SECRET` | optional | GitHub OAuth app client secret. |

For GitHub OAuth, create an app at <https://github.com/settings/developers> with
the callback URL `http://localhost:3000/api/auth/callback/github`. The button is
only shown when both GitHub variables are set.

> `.env.local` is git-ignored — never commit real secrets. Only `.env.example`
> (placeholders) is committed.

## Database migrations (Drizzle)

The schema lives in [`db/schema.ts`](db/schema.ts) (a re-export of the per-feature schemas); generated SQL migrations live in `db/drizzle/`.

```bash
pnpm db:generate   # generate a new migration from schema changes (offline, no DB needed)
pnpm db:migrate    # apply pending migrations to DATABASE_URL
pnpm db:push       # push the schema directly without a migration file (dev only)
pnpm db:studio     # open Drizzle Studio to inspect data
```

## Testing, linting, building

```bash
pnpm test     # Vitest unit tests for the checkout calculation
pnpm lint     # ESLint
pnpm build    # production build
```

## API: `POST /api/checkout`

Authenticated endpoint. Validates the body with Zod, computes the totals,
persists the checkout and its items, and returns the totals.

**Request body**

```jsonc
{
  "items": [
    { "name": "apple",  "unit_price": 1.00, "quantity": 1 },
    { "name": "orange", "unit_price": 0.50, "quantity": 3 }
  ]
}
```

Validation rules: `items` is a non-empty array; each item needs a non-empty
`name`, a finite `unit_price >= 0`, and an integer `quantity >= 1`.

### Example

```bash
# 1. Get a session cookie by signing up (or sign in if the user exists)
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"supersecret123"}'

# 2. Call checkout with that cookie
curl -s -b cookies.txt -X POST http://localhost:3000/api/checkout \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"name":"apple","unit_price":1.00,"quantity":1},
                 {"name":"orange","unit_price":0.50,"quantity":3}]}'
```

**Response — `201 Created`**

```json
{ "subtotal": 2.5, "taxes": 0.33, "discount": 0, "total": 2.83 }
```

(Subtotal `$2.50`; tax `13% = 32.5¢` rounds to `$0.33`; no discount; total `$2.83`.)

**Other responses**

- `401 Unauthorized` — `{"error":"Unauthorized"}` when there is no valid session.
- `400 Bad Request` — `{"error":"Invalid request body","issues":[{"path":"items.0.unit_price","message":"unit_price must be >= 0"}]}` on invalid input.

## Authentication & route protection

Defense in depth, with two layers:

1. **Secure (the real boundary):** `app/(protected)/layout.tsx` reads the
   session server-side (`getSession()`) and redirects to `/signin` if missing,
   and `POST /api/checkout` returns `401` without a valid session.
2. **Optimistic (UX only):** [`proxy.ts`](proxy.ts) (Next.js 16's renamed
   Middleware) does a fast, cookie-only redirect for `/checkout`, `/signin`, and
   `/signup`. It never hits the database and is **not** relied on for security.

## How the design satisfies the distributed-architecture requirement

Everything is **stateless**, so any instance can serve any request and the app
scales horizontally with no sticky sessions:

- **No in-memory state.** The database is accessed through the Neon serverless
  **HTTP** driver (`@neondatabase/serverless`) — each query is an independent
  request with no persistent connection or local pool to keep warm.
- **DB-backed sessions.** Better Auth stores sessions in Postgres (the `session`
  table) and identifies them via an `HttpOnly` cookie. There is no server-side
  in-memory session store, so a request can be handled by any node.
- **Stateless auth flows.** Sign in/up/out are server actions; the session cookie
  travels with each request and is validated against the database.
- **Stateless edge routing.** `proxy.ts` only inspects the request cookie — no
  shared state, no DB.
- **Pure business logic.** `features/checkout/calculate.ts` has no I/O, so the calculation is
  deterministic and trivially parallelizable.
- **Atomic persistence without interactive transactions.** Because the HTTP
  driver has no interactive transactions, the route generates the checkout id up
  front and writes the checkout + its items in a single `db.batch([...])` (one
  atomic round-trip) — no cross-request state required.

## Project structure

```
app/
  (auth)/                      auth pages + shared "redirect if signed in" layout
    layout.tsx                 redirects authenticated users to /checkout
    signin/page.tsx            /signin
    signup/page.tsx            /signup
  (protected)/                 auth-gated pages + shared session guard
    layout.tsx                 getSession() -> redirect to /signin if missing
    checkout/page.tsx          /checkout (route groups add no URL segment)
  api/
    auth/[...all]/route.ts     Better Auth catch-all (OAuth callbacks, session)
    checkout/route.ts          POST /api/checkout
  page.tsx                     redirects / -> /checkout
features/
  auth/                        auth.ts, actions.ts, session.ts, schema.ts,
                               components/auth-form.tsx
  checkout/                    calculate.ts (+ calculate.test.ts), validation.ts,
                               types.ts, schema.ts, components/checkout-form.tsx
db/
  index.ts                     Neon serverless (HTTP) Drizzle client
  schema.ts                    re-export aggregator (features/*/schema.ts)
  drizzle/                     generated SQL migrations
components/ui/                  shared shadcn/ui primitives
lib/utils.ts                   cross-cutting helpers (cn)
proxy.ts                       optimistic, cookie-only auth routing
```
