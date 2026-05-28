import { z } from "zod";

// Validation: items is a non-empty array; each item has a non-empty name,
// a finite unit_price >= 0, and an integer quantity >= 1.
export const itemSchema = z.object({
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

export const checkoutBodySchema = z.object({
  items: z.array(itemSchema).min(1, "items must be a non-empty array"),
});
