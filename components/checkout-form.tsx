"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type Line = { name: string; unitPrice: string; quantity: string };
type Totals = { subtotal: number; taxes: number; discount: number; total: number };

const emptyLine = (): Line => ({ name: "", unitPrice: "", quantity: "1" });

/** Format a dollar number as a 2-decimal string, e.g. 16.9 -> "16.90". */
const money = (n: number) => n.toFixed(2);

export function CheckoutForm() {
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [result, setResult] = useState<Totals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateLine(index: number, field: keyof Line, value: string) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    );
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function calculate() {
    setLoading(true);
    setError(null);
    // Empty numeric fields become NaN -> null in JSON, which the API rejects
    // with a clear message (rather than silently treating them as 0).
    const items = lines.map((line) => ({
      name: line.name.trim(),
      unit_price: line.unitPrice === "" ? Number.NaN : Number(line.unitPrice),
      quantity: line.quantity === "" ? Number.NaN : Number(line.quantity),
    }));

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult(null);
        if (Array.isArray(data.issues) && data.issues.length > 0) {
          setError(
            data.issues
              .map((i: { path: string; message: string }) => `${i.path}: ${i.message}`)
              .join("; "),
          );
        } else {
          setError(data.error ?? "Something went wrong.");
        }
        return;
      }

      setResult(data as Totals);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add line items, then calculate the totals.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="hidden grid-cols-[1fr_7rem_5rem_2rem] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
          <span>Name</span>
          <span>Unit price</span>
          <span>Qty</span>
          <span className="sr-only">Remove</span>
        </div>

        {lines.map((line, index) => (
          <div key={index} className="grid grid-cols-[1fr_7rem_5rem_2rem] items-center gap-2">
            <Input
              aria-label={`Item ${index + 1} name`}
              placeholder="Item name"
              value={line.name}
              onChange={(e) => updateLine(index, "name", e.target.value)}
            />
            <Input
              aria-label={`Item ${index + 1} unit price`}
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={line.unitPrice}
              onChange={(e) => updateLine(index, "unitPrice", e.target.value)}
            />
            <Input
              aria-label={`Item ${index + 1} quantity`}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={line.quantity}
              onChange={(e) => updateLine(index, "quantity", e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeLine(index)}
              disabled={lines.length === 1}
              aria-label={`Remove item ${index + 1}`}
            >
              <X />
            </Button>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="lg" onClick={addLine}>
            <Plus />
            Add item
          </Button>
          <Button type="button" size="lg" onClick={calculate} disabled={loading}>
            {loading ? "Calculating…" : "Calculate"}
          </Button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {result && (
        <Card size="sm">
          <CardContent>
            <dl className="text-sm">
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">${money(result.subtotal)}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground">Taxes (13%)</dt>
                <dd className="tabular-nums">${money(result.taxes)}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="tabular-nums">
                  {result.discount > 0 ? `-$${money(result.discount)}` : `$${money(0)}`}
                </dd>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between py-1">
                <dt className="font-semibold">Total</dt>
                <dd className="font-semibold tabular-nums">${money(result.total)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
