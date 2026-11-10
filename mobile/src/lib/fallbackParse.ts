import { todayISO } from "./format";
import type { Draft, EntryType, PaymentMethod } from "./types";

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20,
};
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function nextWeekday(name: string, from = new Date()): string {
  const target = DAYS.indexOf(name);
  const d = new Date(from);
  const diff = ((target - d.getDay() + 7) % 7) || 7;
  d.setDate(d.getDate() + diff);
  return todayISO(d);
}

/**
 * A simple rule-based parser so the app still works with no API key.
 * Good enough for a demo in English and Pidgin; the Claude route is the real one.
 */
export function fallbackParse(text: string): Draft {
  const t = text.toLowerCase().replace(/,/g, "");

  let type: EntryType = "sale";
  if (/\b(i buy|i bought|bought|i collect from|from (my )?supplier|restock)\b/.test(t)) type = "purchase";
  else if (/\b(don pay|has paid|paid me|pay me|bring (my )?money|settle)/.test(t)) type = "payment";

  let payment: PaymentMethod = "cash";
  if (type === "sale" && /(credit|go pay|will pay|owe|balance|go bring)/.test(t)) payment = "credit";
  else if (/(transfer|send am|bank|pos)/.test(t)) payment = "transfer";

  let amount = 0;
  const money = t.match(/(?:₦|n)?\s?(\d+(?:\.\d+)?)\s?(k|thousand)?\b(?!\s?(bag|bags|carton|cartons|kg|pieces|tins))/g);
  if (money) {
    const values = money.map((m) => {
      const n = parseFloat(m.replace(/[^\d.]/g, ""));
      return /k|thousand/.test(m) ? n * 1000 : n;
    });
    amount = Math.max(...values);
  }

  let quantity: number | null = null;
  let unit: string | null = null;
  const q = t.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)\s+(bags?|cartons?|kg|pieces?|tins?|crates?|packs?)\b/);
  if (q) {
    quantity = NUMBER_WORDS[q[1]] ?? parseInt(q[1], 10);
    unit = q[2].endsWith("s") || quantity === 1 ? q[2] : `${q[2]}s`;
  }

  let item = "";
  const it = t.match(/(?:bags?|cartons?|kg|pieces?|tins?|crates?|packs?)\s+(?:of\s+)?([a-z]+)/);
  if (it) item = it[1][0].toUpperCase() + it[1].slice(1);

  let party: string | null = null;
  const p =
    text.match(/\b((?:Mama|Iya|Baba|Alhaji|Aunty|Auntie|Brother|Sister|Mr|Mrs|Oga)\s+[A-Z][a-z]+)/) ??
    text.match(/\b(?:to|from|for)\s+([A-Z][a-z]+)/);
  if (p) party = p[1];

  let dueDate: string | null = null;
  if (payment === "credit") {
    const day = DAYS.find((d) => t.includes(d));
    if (day) dueDate = nextWeekday(day);
    else if (t.includes("tomorrow")) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dueDate = todayISO(d);
    }
  }

  return { type, item, quantity, unit, amount, party, payment, dueDate, transcript: text };
}
