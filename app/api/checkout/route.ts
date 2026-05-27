import { z } from "zod";

import { db } from "@/db";
import { checkout, checkoutItem } from "@/db/schema";
import {
  calculateCheckout,
  toCents,
  toResponseAmounts,
  type CheckoutItemInput,
} from "@/lib/checkout";
import { getSession } from "@/lib/session";

// Validation: items is a non-empty array; each item has a non-empty name,
// a finite unit_price >= 0, and an integer quantity >= 1.
const itemSchema = z.object({
  name: z.string().trim().min(1, "name must be a non-empty string"),
  unit_price: z
    .number({ message: "unit_price must be a number" })
    .finite("unit_price must be a finite number")
    .min(0, "unit_price must be >= 0"),
  quantity: z
    .number({ message: "quantity must be a number" })
    .int("quantity must be an integer")
    .min(1, "quantity must be >= 1"),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1, "items must be a non-empty array"),
});

export async function POST(request: Request) {
  // 1. Authentication — reject unauthenticated requests.
  const session = await getSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate the body, returning 400 with clear messages.
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join(".") || "(root)",
      message: issue.message,
    }));
    return Response.json({ error: "Invalid request body", issues }, { status: 400 });
  }

  const { items } = parsed.data;

  // 3. Calculate totals (pure, in cents).
  const lineItems: CheckoutItemInput[] = items.map((item) => ({
    name: item.name,
    unitPrice: item.unit_price,
    quantity: item.quantity,
  }));
  const totals = calculateCheckout(lineItems);

  // 4. Persist the checkout and its items atomically. The Neon HTTP driver has
  // no interactive transactions, so we generate the id up front and use
  // db.batch([...]), which runs both inserts in a single atomic round-trip.
  const checkoutId = crypto.randomUUID();
  await db.batch([
    db.insert(checkout).values({
      id: checkoutId,
      userId: session.user.id,
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      discount: totals.discount,
      total: totals.total,
    }),
    db.insert(checkoutItem).values(
      items.map((item) => ({
        checkoutId,
        name: item.name,
        unitPrice: toCents(item.unit_price),
        quantity: item.quantity,
      })),
    ),
  ]);

  // 5. Return the calculated fields as 2-decimal-dollar numbers.
  return Response.json(toResponseAmounts(totals), { status: 201 });
}
