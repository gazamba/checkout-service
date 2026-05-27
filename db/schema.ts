import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/* ---------------------------------------------------------------------------
 * Better Auth tables
 *
 * Field/column shape mirrors Better Auth's canonical core schema
 * (@better-auth/core `getAuthTables`). Two hard rules the Drizzle adapter
 * relies on:
 *   1. Each table is exported under its singular model name (`user`,
 *      `session`, `account`, `verification`) — the adapter looks up
 *      `schema[model]`.
 *   2. The object PROPERTY KEYS must be the camelCase field names
 *      (`emailVerified`, `userId`, `createdAt`, ...). The SQL column names
 *      (the string args below) are free, so we use snake_case per Postgres
 *      convention; Drizzle maps property -> column.
 *
 * IDs are `text` with no DB default: Better Auth generates the id itself and
 * passes it on insert.
 * ------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ---------------------------------------------------------------------------
 * Checkout tables
 *
 * All money is stored as INTEGER CENTS (per spec) to avoid floating-point
 * drift. `userId` is `text` because it references Better Auth's text-id user.
 * ------------------------------------------------------------------------- */

export const checkout = pgTable("checkout", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  subtotal: integer("subtotal").notNull(), // cents
  taxes: integer("taxes").notNull(), // cents
  discount: integer("discount").notNull(), // cents
  total: integer("total").notNull(), // cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const checkoutItem = pgTable("checkout_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  checkoutId: uuid("checkout_id")
    .notNull()
    .references(() => checkout.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  unitPrice: integer("unit_price").notNull(), // cents
  quantity: integer("quantity").notNull(),
});
