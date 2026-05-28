import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside the Next.js runtime, so load `.env*` files the same
// way Next.js does (see node_modules/next/dist/docs/.../environment-variables.md).
loadEnvConfig(process.cwd());

// `generate` is an offline schema-diff and needs no DB connection;
// `migrate`/`push`/`studio` do. Warn (don't throw) so generation works without
// a live database — drizzle-kit will error clearly on the commands that connect.
if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠ DATABASE_URL is not set. `db:generate` works offline, but `db:migrate`/`db:push`/`db:studio` need it. Copy .env.example to .env.local.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
