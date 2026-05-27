import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

/**
 * Neon serverless (HTTP) driver. It is stateless — each query is an independent
 * HTTP request with no persistent connection or in-memory pool — which is what
 * the distributed-architecture requirement calls for. Interactive transactions
 * aren't supported on this driver; use `db.batch([...])` for atomic multi-writes.
 */
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
