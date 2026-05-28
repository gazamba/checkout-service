import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "@/features/auth/schema";

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
