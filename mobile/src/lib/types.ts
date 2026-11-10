export type EntryType = "sale" | "purchase" | "payment";
export type PaymentMethod = "cash" | "transfer" | "credit";

/** One line in the trader's book. Amounts are whole naira. */
export interface Entry {
  id: string;
  type: EntryType;
  /** What was sold or bought, e.g. "Rice". Empty for a payment. */
  item: string;
  quantity: number | null;
  unit: string | null;
  amount: number;
  /** Customer for sales and payments, supplier for purchases. */
  party: string | null;
  payment: PaymentMethod;
  /** YYYY-MM-DD, only for credit sales. */
  dueDate: string | null;
  /** ISO timestamp of when it was recorded. */
  createdAt: string;
  /** What the trader actually said, kept for trust and for training data later. */
  transcript: string;
}

/** An entry as it comes back from parsing, before the trader confirms it. */
export type Draft = Omit<Entry, "id" | "createdAt">;
