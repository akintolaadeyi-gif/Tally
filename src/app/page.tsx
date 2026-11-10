"use client";

import Link from "next/link";
import { EntryRow, MicIcon } from "@/components/ui";
import { naira } from "@/lib/format";
import { todaySummary } from "@/lib/ledger";
import { sampleEntries } from "@/lib/sample";
import { replaceAll, useEntries } from "@/lib/store";

function greeting(h = new Date().getHours()) {
  if (h < 12) return "Ẹ káàárọ̀";
  if (h < 16) return "Ẹ káàsán";
  return "Ẹ kúrọ̀lẹ́";
}

export default function Home() {
  const entries = useEntries();
  const today = todaySummary(entries);
  const recent = entries.slice(0, 3);
  const dateLabel = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "short" });

  return (
    <div className="flex flex-1 flex-col gap-5">
      <header className="flex flex-col gap-0.5">
        <span className="text-[13px] text-muted">{dateLabel}</span>
        <h1 className="text-2xl font-bold tracking-tight">{greeting()}</h1>
      </header>

      <section className="flex flex-col gap-3.5 rounded-[20px] bg-green p-5 text-white" aria-label="Today's sales">
        <span className="text-[13px] opacity-85">Today&apos;s sales</span>
        <span className="font-display text-[40px] font-bold leading-none">{naira(today.total)}</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-xl bg-white/12 p-3">
            <span className="text-xs opacity-85">Cash and transfer</span>
            <span className="text-lg font-semibold">{naira(today.paid)}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-white/12 p-3">
            <span className="text-xs opacity-85">On credit</span>
            <span className="text-lg font-semibold">{naira(today.credit)}</span>
          </div>
        </div>
      </section>

      <section className="flex flex-1 flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Recent</h2>
          <div className="flex gap-4">
            <Link href="/business" className="py-3 text-sm font-semibold text-green">My record</Link>
            <Link href="/debts" className="py-3 text-sm font-semibold text-green">Who owes me</Link>
          </div>
        </div>
        {recent.length ? (
          <ul className="flex flex-col gap-2.5">
            {recent.map((e) => <EntryRow key={e.id} e={e} />)}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-white p-4">
            <p className="text-sm text-ink-2">Nothing recorded yet. Press the button below and say a sale, like “I sell two bag rice to Mama Tunde, 12k, she go pay Friday.”</p>
            <button onClick={() => replaceAll(sampleEntries())} className="h-11 rounded-xl border border-line px-4 text-sm font-semibold">
              Load sample data
            </button>
          </div>
        )}
      </section>

      <div className="flex flex-col items-center gap-2.5">
        <Link
          href="/record"
          aria-label="Speak a sale"
          className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-green shadow-[0_8px_24px_rgba(15,107,74,0.35)] active:bg-green-deep"
        >
          <MicIcon />
        </Link>
        <span className="text-sm text-ink-2">Tap and say what you sold</span>
      </div>
    </div>
  );
}
