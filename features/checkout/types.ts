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
