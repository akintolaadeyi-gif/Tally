import Link from "next/link";
import type { ReactNode } from "react";
import { naira, time } from "@/lib/format";
import type { Entry } from "@/lib/types";

export function MicIcon({ size = 36, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="22" />
    </svg>
  );
}

export function StopIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function ScreenHeader({ title, back = "/" }: { title: string; back?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link href={back} aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16201B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <h1 className="font-display text-xl font-bold">{title}</h1>
    </div>
  );
}

const TAGS = {
  credit: "bg-amber-bg text-amber-ink",
  transfer: "bg-green-soft text-green-deep",
  cash: "bg-green-soft text-green-deep",
  stock: "bg-stone text-ink-2",
  paid: "bg-green-soft text-green-deep",
  overdue: "bg-overdue-bg text-[#7A2509]",
} as const;

export function Tag({ kind, children }: { kind: keyof typeof TAGS; children: ReactNode }) {
  return <span className={`rounded-lg px-2 py-[3px] text-[11px] font-semibold ${TAGS[kind]}`}>{children}</span>;
}

export function describe(e: Entry): string {
  if (e.type === "payment") return `Paid back`;
  const qty = e.quantity ? `${e.quantity} ${e.unit ?? ""} of `.replace("  ", " ") : "";
  const what = `${qty}${e.item ? e.item.toLowerCase() : "goods"}`;
  return e.type === "purchase" ? `Bought: ${what}` : what.charAt(0).toUpperCase() + what.slice(1);
}

export function EntryRow({ e }: { e: Entry }) {
  const who = e.party ?? (e.type === "sale" ? "Walk-in" : "");
  const signed = e.type === "purchase" ? -e.amount : e.amount;
  const tag =
    e.type === "purchase" ? <Tag kind="stock">Stock</Tag>
    : e.type === "payment" ? <Tag kind="paid">Payment</Tag>
    : e.payment === "credit" ? <Tag kind="credit">Credit</Tag>
    : <Tag kind={e.payment}>{e.payment === "cash" ? "Cash" : "Transfer"}</Tag>;
  return (
    <li className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold">{describe(e)}</span>
        <span className="text-[13px] text-muted">{[who, time(e.createdAt)].filter(Boolean).join(" · ")}</span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[15px] font-semibold">{naira(signed)}</span>
        {tag}
      </div>
    </li>
  );
}
