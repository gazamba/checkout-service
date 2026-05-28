/**
 * Schema aggregator. The actual table definitions live with their features:
 *   - Better Auth tables (user/session/account/verification): features/auth/schema.ts
 *   - checkout / checkout_item: features/checkout/schema.ts
 *
 * drizzle.config.ts and the Drizzle client point here, so this re-export keeps
 * a single schema entry point while the definitions stay feature-local.
 */
export * from "@/features/auth/schema";
export * from "@/features/checkout/schema";
