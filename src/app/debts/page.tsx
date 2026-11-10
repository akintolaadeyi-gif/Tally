"use client";

import Link from "next/link";
import { ScreenHeader } from "@/components/ui";
import { naira, shortDate } from "@/lib/format";
import { debts } from "@/lib/ledger";
import { addEntry, useEntries } from "@/lib/store";
import type { Debt } from "@/lib/ledger";

function reminderLink(d: Debt) {
  const text = `Good day ${d.customer}, this is a friendly reminder from my shop. You have a balance of ${naira(d.owed)}${d.dueDate ? ` that was due ${shortDate(d.dueDate)}` : ""}. Thank you!`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function markPaid(d: Debt) {
  addEntry({
    type: "payment",
    item: "",
    quantity: null,
    unit: null,
    amount: d.owed,
    party: d.customer,
    payment: "cash",
    dueDate: null,
    transcript: `Marked as paid: ${d.customer}, ${naira(d.owed)}`,
  });
}

export default function DebtsPage() {
  const list = debts(useEntries());
  const total = list.reduce((s, d) => s + d.owed, 0);
  const overdue = list.filter((d) => d.daysOverdue > 0).length;

  return (
    <div className="flex flex-1 flex-col gap-[18px]">
      <ScreenHeader title="Who owes me" />

      <section className="flex flex-col gap-1.5 rounded-[20px] bg-amber-bg p-[18px]">
        <span className="text-[13px] text-amber-ink">Total owed to you</span>
        <span className="font-display text-[34px] font-bold text-amber-deep">{naira(total)}</span>
        <span className="text-[13px] text-amber-ink">
          {list.length} {list.length === 1 ? "customer" : "customers"} · {overdue} overdue
        </span>
      </section>

      {list.length === 0 ? (
        <p className="rounded-2xl bg-white p-4 text-sm text-ink-2">Nobody owes you money right now.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {list.map((d) => (
            <li key={d.customer} className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">{d.customer}</span>
                  {d.daysOverdue > 0 ? (
                    <span className="text-[13px] font-semibold text-overdue">
                      {d.daysOverdue} {d.daysOverdue === 1 ? "day" : "days"} overdue
                    </span>
                  ) : (
                    <span className="text-[13px] text-muted">{d.dueDate ? `Due ${shortDate(d.dueDate)}` : "No date set"}</span>
                  )}
                </div>
                <span className="text-base font-semibold">{naira(d.owed)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a href={reminderLink(d)} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center rounded-xl bg-green text-[13px] font-semibold text-white">
                  Send reminder
                </a>
                <button onClick={() => markPaid(d)} className="h-11 rounded-xl border border-line bg-white text-[13px] font-semibold">
                  Mark as paid
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex-1" />
      <p className="text-[13px] leading-relaxed text-muted">Reminders open WhatsApp with a polite message ready to send. Voice-note reminders in your own language come next.</p>
      <Link href="/business" className="flex h-[52px] items-center justify-center rounded-2xl border border-green text-[15px] font-semibold text-green">
        See my business record
      </Link>
    </div>
  );
}
