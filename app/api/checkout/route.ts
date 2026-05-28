import { db } from "@/db";
import { checkout, checkoutItem } from "@/db/schema";
import {
  calculateCheckout,
  toCents,
  toResponseAmounts,
} from "@/features/checkout/calculate";
import type { CheckoutItemInput } from "@/features/checkout/types";
import { checkoutBodySchema } from "@/features/checkout/validation";
import { getSession } from "@/features/auth/session";

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

  const parsed = checkoutBodySchema.safeParse(json);
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
