import { daysBetween, todayISO } from "./format";
import type { Entry } from "./types";

export function isToday(e: Entry, today = todayISO()) {
  return todayISO(new Date(e.createdAt)) === today;
}

export function todaySummary(entries: Entry[]) {
  const sales = entries.filter((e) => e.type === "sale" && isToday(e));
  const total = sales.reduce((s, e) => s + e.amount, 0);
  const credit = sales.filter((e) => e.payment === "credit").reduce((s, e) => s + e.amount, 0);
  return { total, credit, paid: total - credit, count: sales.length };
}

export interface Debt {
  customer: string;
  owed: number;
  /** Earliest due date among sales not yet covered by payments. */
  dueDate: string | null;
  daysOverdue: number;
}

interface Settlement {
  dueDate: string | null;
  paidOn: string;
}

/**
 * Applies each customer's payments to their credit sales, oldest first.
 * Returns what is still owed, plus when each settled sale was paid off,
 * which feeds the on-time payment rate.
 */
function walkCredit(entries: Entry[]) {
  const byCustomer = new Map<string, Entry[]>();
  for (const e of entries) {
    if (!e.party) continue;
    const isCreditSale = e.type === "sale" && e.payment === "credit";
    if (!isCreditSale && e.type !== "payment") continue;
    const key = e.party.trim();
    byCustomer.set(key, [...(byCustomer.get(key) ?? []), e]);
  }

  const debts: Debt[] = [];
  const settlements: Settlement[] = [];
  const today = todayISO();

  for (const [customer, list] of byCustomer) {
    const ordered = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const open: { remaining: number; dueDate: string | null }[] = [];
    let credit = 0; // payments received before any sale they could cover
    for (const e of ordered) {
      if (e.type === "sale") {
        let remaining = e.amount;
        const use = Math.min(credit, remaining);
        credit -= use;
        remaining -= use;
        if (remaining > 0) open.push({ remaining, dueDate: e.dueDate });
        else settlements.push({ dueDate: e.dueDate, paidOn: todayISO(new Date(e.createdAt)) });
      } else {
        let pay = e.amount;
        while (pay > 0 && open.length) {
          const first = open[0];
          const use = Math.min(pay, first.remaining);
          first.remaining -= use;
          pay -= use;
          if (first.remaining === 0) {
            settlements.push({ dueDate: first.dueDate, paidOn: todayISO(new Date(e.createdAt)) });
            open.shift();
          }
        }
        credit += pay;
      }
    }
    const owed = open.reduce((s, o) => s + o.remaining, 0);
    if (owed > 0) {
      const dueDate = open.map((o) => o.dueDate).filter((d): d is string => !!d).sort()[0] ?? null;
      debts.push({
        customer,
        owed,
        dueDate,
        daysOverdue: dueDate ? Math.max(0, daysBetween(dueDate, today)) : 0,
      });
    }
  }

  debts.sort((a, b) => b.daysOverdue - a.daysOverdue || b.owed - a.owed);
  return { debts, settlements };
}

export function debts(entries: Entry[]): Debt[] {
  return walkCredit(entries).debts;
}

export const RECORD_GOAL_DAYS = 90;

export function businessRecord(entries: Entry[]) {
  const days = new Set(entries.map((e) => todayISO(new Date(e.createdAt))));
  const sales = entries.filter((e) => e.type === "sale");
  let weeklySales: number | null = null;
  if (sales.length) {
    const first = sales.reduce((m, e) => (e.createdAt < m ? e.createdAt : m), sales[0].createdAt);
    const spanDays = Math.max(7, daysBetween(todayISO(new Date(first)), todayISO()) + 1);
    weeklySales = (sales.reduce((s, e) => s + e.amount, 0) / spanDays) * 7;
  }
  const { settlements } = walkCredit(entries);
  const onTime = settlements.filter((s) => !s.dueDate || s.paidOn <= s.dueDate).length;
  return {
    daysRecorded: days.size,
    weeklySales,
    onTimeRate: settlements.length ? onTime / settlements.length : null,
  };
}
