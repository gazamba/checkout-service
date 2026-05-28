import { z } from "zod";

// Validation: items is a non-empty array; each item has a non-empty name,
// a finite unit_price >= 0, and an integer quantity >= 1. Messages are written
// for end users (they're surfaced in the UI) and lead with the field label.
export const itemSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  unit_price: z
    .number({ message: "Unit price must be a number" })
    .finite("Unit price must be a number")
    .min(0, "Unit price can't be negative"),
  quantity: z
    .number({ message: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
});

export const checkoutBodySchema = z.object({
  items: z.array(itemSchema).min(1, "Add at least one item"),
});
