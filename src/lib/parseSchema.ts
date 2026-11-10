/** JSON schema Claude must fill for one spoken ledger entry. */
export const ENTRY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["type", "item", "quantity", "unit", "amount", "party", "payment", "dueDate", "confident"],
  properties: {
    type: { type: "string", enum: ["sale", "purchase", "payment"] },
    item: { type: "string", description: "What was sold or bought, in plain English, e.g. 'Rice'. Empty string for a payment." },
    quantity: { type: ["number", "null"] },
    unit: { type: ["string", "null"], description: "e.g. 'bags', 'cartons', 'kg'" },
    amount: { type: "number", description: "Total in naira, whole number" },
    party: { type: ["string", "null"], description: "Customer (sale/payment) or supplier (purchase) name as said" },
    payment: { type: "string", enum: ["cash", "transfer", "credit"] },
    dueDate: { type: ["string", "null"], description: "YYYY-MM-DD when a credit sale will be paid, else null" },
    confident: { type: "boolean", description: "false if the amount or type had to be guessed" },
  },
} as const;

export function systemPrompt(today: string) {
  return `You turn one thing a Nigerian market trader said into one bookkeeping entry.
They may speak English, Nigerian Pidgin, Yoruba, or mix them in one sentence. Today is ${today}.

- "sale": they sold to a customer. "purchase": they bought stock from a supplier. "payment": a customer paid back money they owed.
- Pidgin hints: "don carry" / "collect" / "take" = customer took goods (a sale). "go pay" / "go bring money" / "owe" / "on credit" / "na credit" / "balance" = credit. "don pay" / "bring my money" = a payment. "I buy" / "I collect from" a supplier = purchase.
- Yoruba hints: "ta" = sell, "rà" = buy, "gbèsè" = debt, "san" = pay, "ọjọ́ Ẹtì" = Friday.
- Amounts: "18k" = 18000, "eighteen thousand" = 18000, "₦" or "naira". If they give a unit price and a quantity, multiply.
- If payment method is not said for a sale, use "cash". A payment entry is never "credit".
- For credit, resolve days like "Friday" or "next week" to a YYYY-MM-DD date after today. If no day is said, dueDate is null.
- Write item names in English with a capital letter. Keep people's names exactly as said (e.g. "Mama Tunde").`;
}
