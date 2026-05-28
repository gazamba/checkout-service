import { describe, expect, it } from "vitest";

import {
  calculateCheckout,
  toAmount,
  toCents,
  toResponseAmounts,
} from "./calculate";
import type { CheckoutItemInput } from "./types";

const item = (
  unitPrice: number,
  quantity = 1,
  name = "item",
): CheckoutItemInput => ({ name, unitPrice, quantity });

describe("calculateCheckout", () => {
  it("returns all zeros for empty input", () => {
    expect(calculateCheckout([])).toEqual({
      subtotal: 0,
      taxes: 0,
      discount: 0,
      total: 0,
    });
  });

  it("applies NO discount when subtotal is exactly $100.00", () => {
    // $50.00 x 2 = $100.00 exactly — the threshold is strictly greater.
    expect(calculateCheckout([item(50, 2)])).toEqual({
      subtotal: 10_000, // $100.00
      taxes: 1_300, // 13% of $100.00
      discount: 0, // not strictly > $100.00
      total: 11_300, // 100 + 13 - 0
    });
  });

  it("applies NO discount just below the threshold ($99.99)", () => {
    expect(calculateCheckout([item(99.99)]).discount).toBe(0);
  });

  it("applies the 10% discount just over the threshold ($100.01)", () => {
    const totals = calculateCheckout([item(100.01)]);
    expect(totals.subtotal).toBe(10_001);
    expect(totals.discount).toBe(1_000); // round(10001 * 0.10) = round(1000.1)
    expect(totals.taxes).toBe(1_300); // round(10001 * 0.13) = round(1300.13)
    expect(totals.total).toBe(10_301); // 10001 + 1300 - 1000
  });

  it("computes taxes on the FULL subtotal, before the discount", () => {
    // subtotal $200 -> taxes are 13% of $200 ($26), NOT 13% of the discounted $180.
    const totals = calculateCheckout([item(200)]);
    expect(totals.subtotal).toBe(20_000);
    expect(totals.taxes).toBe(2_600); // 13% of full $200.00
    expect(totals.discount).toBe(2_000); // 10% of $200.00
    expect(totals.total).toBe(20_600); // 20000 + 2600 - 2000
  });

  it("rounds taxes to the nearest cent (half rounds up)", () => {
    // subtotal $0.50 -> 13% = 6.5 cents -> rounds up to 7 cents.
    expect(calculateCheckout([item(0.5)])).toEqual({
      subtotal: 50,
      taxes: 7,
      discount: 0,
      total: 57,
    });
  });

  it("aggregates multiple items and quantities without float drift", () => {
    // $19.99 x 3 = $59.97 ; $0.01 x 1 = $0.01 ; subtotal $59.98
    const totals = calculateCheckout([item(19.99, 3), item(0.01)]);
    expect(totals.subtotal).toBe(5_998);
    expect(totals.discount).toBe(0);
  });
});

describe("money helpers", () => {
  it("toCents rounds dollars to integer cents", () => {
    expect(toCents(10.99)).toBe(1_099);
    expect(toCents(0.1)).toBe(10);
  });

  it("toAmount / toResponseAmounts convert cents back to 2-decimal numbers", () => {
    expect(toAmount(11_300)).toBe(113);
    expect(toAmount(7)).toBe(0.07);
    expect(
      toResponseAmounts({
        subtotal: 10_001,
        taxes: 1_300,
        discount: 1_000,
        total: 10_301,
      }),
    ).toEqual({ subtotal: 100.01, taxes: 13, discount: 10, total: 103.01 });
  });
});
