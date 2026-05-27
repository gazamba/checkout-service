/**
 * Pure checkout calculation — no I/O, fully unit-testable in isolation.
 *
 * All money is computed in integer CENTS to avoid floating-point drift.
 * `unitPrice` inputs are in DOLLARS (e.g. 10.99) and converted to cents at the
 * boundary; the returned totals are in CENTS.
 *
 * Business rules (per spec — intentional, do NOT "fix"):
 *   subtotal = Σ (unitPrice * quantity)
 *   taxes    = 13% of subtotal, computed on the FULL subtotal (before discount)
 *   discount = 10% of subtotal, ONLY when subtotal is strictly greater than
 *              $100.00 (exactly $100.00 gets no discount)
 *   total    = subtotal + taxes - discount
 */

export interface CheckoutItemInput {
  name: string;
  /** Price per unit, in dollars (e.g. 10.99). */
  unitPrice: number;
  /** Whole number of units, >= 1. */
  quantity: number;
}

export interface CheckoutTotals {
  /** All values are integer cents. */
  subtotal: number;
  taxes: number;
  discount: number;
  total: number;
}

const TAX_RATE_BPS = 1300; // 13.00%, in basis points
const DISCOUNT_RATE_BPS = 1000; // 10.00%, in basis points
const BPS_DIVISOR = 10_000;
/** Discount applies only when subtotal is strictly ABOVE this ($100.00). */
const DISCOUNT_THRESHOLD_CENTS = 100_00;

/** Convert a dollar amount to integer cents, rounded to the nearest cent. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Convert integer cents to a dollar amount rounded to 2 decimal places. */
export function toAmount(cents: number): number {
  return Math.round(cents) / 100;
}

export function calculateCheckout(items: CheckoutItemInput[]): CheckoutTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + toCents(item.unitPrice) * item.quantity,
    0,
  );

  // Taxes are intentionally computed on the FULL subtotal (before discount).
  const taxes = Math.round((subtotal * TAX_RATE_BPS) / BPS_DIVISOR);

  // Strictly greater than $100.00 — exactly $100.00 gets no discount.
  const discount =
    subtotal > DISCOUNT_THRESHOLD_CENTS
      ? Math.round((subtotal * DISCOUNT_RATE_BPS) / BPS_DIVISOR)
      : 0;

  const total = subtotal + taxes - discount;

  return { subtotal, taxes, discount, total };
}

/**
 * Format cent totals as 2-decimal dollar numbers for the API JSON response,
 * e.g. { subtotal: 11300 } -> { subtotal: 113 }, { taxes: 7 } -> { taxes: 0.07 }.
 */
export function toResponseAmounts(totals: CheckoutTotals): CheckoutTotals {
  return {
    subtotal: toAmount(totals.subtotal),
    taxes: toAmount(totals.taxes),
    discount: toAmount(totals.discount),
    total: toAmount(totals.total),
  };
}
