"use client";

import { LockIcon, ScreenHeader } from "@/components/ui";
import { naira } from "@/lib/format";
import { businessRecord, RECORD_GOAL_DAYS } from "@/lib/ledger";
import { useEntries } from "@/lib/store";

const UNLOCKS = [
  { day: 60, title: "Stock now, pay later", body: "Your suppliers can see you sell steadily and give you goods on credit." },
  { day: 90, title: "Small business loan", body: "Partner lenders offer loans based on your real sales, not paperwork." },
];

export default function BusinessPage() {
  const r = businessRecord(useEntries());
  const pct = Math.min(100, Math.round((r.daysRecorded / RECORD_GOAL_DAYS) * 100));

  return (
    <div className="flex flex-1 flex-col gap-[18px]">
      <ScreenHeader title="My business record" back="/debts" />

      <section className="flex flex-col gap-3 rounded-[20px] bg-white p-[18px]">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">Days recorded</span>
          <span className="font-display text-[22px] font-bold">
            {r.daysRecorded} <span className="text-sm font-medium text-muted">of {RECORD_GOAL_DAYS}</span>
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-stone" role="img" aria-label={`${r.daysRecorded} of ${RECORD_GOAL_DAYS} days recorded`}>
          <div className="h-2.5 rounded-full bg-green" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[13px] leading-relaxed text-ink-2">
          {r.daysRecorded >= RECORD_GOAL_DAYS
            ? "Your record is strong enough to show a lender or supplier."
            : `Keep recording every day. At ${RECORD_GOAL_DAYS} days your record is strong enough to show a lender or supplier.`}
        </span>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1 rounded-2xl bg-white p-3.5">
          <span className="text-xs text-muted">Average weekly sales</span>
          <span className="text-lg font-semibold">{r.weeklySales === null ? "—" : naira(r.weeklySales)}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl bg-white p-3.5">
          <span className="text-xs text-muted">Customers who paid on time</span>
          <span className="text-lg font-semibold">{r.onTimeRate === null ? "—" : `${Math.round(r.onTimeRate * 100)}%`}</span>
        </div>
      </div>

      <h2 className="mt-1 text-[15px] font-semibold">What your record can unlock</h2>
      <ul className="flex flex-col gap-2.5">
        {UNLOCKS.map((u) => {
          const ready = r.daysRecorded >= u.day;
          return (
            <li key={u.title} className="flex flex-col gap-1.5 rounded-2xl bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold">{u.title}</span>
                <span className={`rounded-lg px-2 py-[3px] text-[11px] font-semibold ${ready ? "bg-green-soft text-green-deep" : "bg-stone text-ink-2"}`}>
                  {ready ? "Ready" : `Day ${u.day}`}
                </span>
              </div>
              <span className="text-[13px] leading-relaxed text-muted">{u.body}</span>
            </li>
          );
        })}
      </ul>

      <div className="flex-1" />
      <div className="flex items-start gap-2.5">
        <LockIcon />
        <span className="text-[13px] leading-relaxed text-ink-2">Your record stays on this phone. Nobody sees it unless you choose to share it.</span>
      </div>
    </div>
  );
}
