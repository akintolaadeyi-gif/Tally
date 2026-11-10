"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MicIcon, ScreenHeader, StopIcon } from "@/components/ui";
import { shortDate, todayISO } from "@/lib/format";
import { browserSpeechAvailable, listenInBrowser, recordForServer, type Listener } from "@/lib/speech";
import { addEntry } from "@/lib/store";
import type { Draft, EntryType, PaymentMethod } from "@/lib/types";

type Phase = "idle" | "listening" | "working" | "confirm" | "typing";

export default function RecordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<"server" | "browser" | "none">("browser");
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listener = useRef<Listener | null>(null);
  const started = useRef<number>(0);

  useEffect(() => {
    fetch("/api/transcribe")
      .then((r) => r.json())
      .then(({ mode }: { mode: "server" | "browser" }) => {
        if (mode === "server") setMode("server");
        else setMode(browserSpeechAvailable() ? "browser" : "none");
      })
      .catch(() => setMode(browserSpeechAvailable() ? "browser" : "none"));
  }, []);

  async function start() {
    setError(null);
    setHeard("");
    try {
      listener.current = mode === "server" ? await recordForServer() : listenInBrowser(setHeard);
      started.current = Date.now();
      setPhase("listening");
    } catch {
      setError("Tally could not use the microphone. You can type the entry instead.");
      setPhase("typing");
    }
  }

  async function stop() {
    if (!listener.current) return;
    setPhase("working");
    try {
      const text = await listener.current.stop();
      listener.current = null;
      if (!text) {
        setError("Tally didn't catch that. Try again, a little closer to the phone.");
        setPhase("idle");
        return;
      }
      setHeard(text);
      await understand(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("idle");
    }
  }

  async function understand(text: string) {
    setPhase("working");
    const res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, today: todayISO() }),
    });
    const data = (await res.json()) as { draft?: Draft; error?: string };
    if (!data.draft) {
      setError(data.error ?? "Tally couldn't understand that entry.");
      setPhase("idle");
      return;
    }
    setHeard(text);
    setDraft(data.draft);
    setPhase("confirm");
  }

  function save() {
    if (!draft) return;
    addEntry(draft);
    router.push("/");
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <div className="flex flex-1 flex-col gap-[18px]">
      <ScreenHeader title="New entry" />

      {(phase === "idle" || phase === "listening" || phase === "working") && (
        <>
          <div className="flex min-h-[140px] flex-col gap-3 rounded-[20px] bg-white p-[18px]">
            <div className="flex items-center gap-2.5">
              <div className={`h-2.5 w-2.5 rounded-full ${phase === "listening" ? "animate-pulse bg-overdue" : "bg-green"}`} />
              <span className="text-[13px] font-semibold text-green">
                {phase === "listening" ? "Listening…" : phase === "working" ? "Writing it down…" : "Ready"}
              </span>
            </div>
            <p className="text-[19px] font-medium leading-snug" aria-live="polite">
              {heard ? `“${heard}”` : phase === "listening" ? "Say what you sold, to who, how much, and how they paid." : "Example: “Mama Tunde don carry three bag rice, 18k. She go pay Friday.”"}
            </p>
          </div>
          {error && <p role="alert" className="rounded-xl bg-overdue-bg px-4 py-3 text-sm text-[#7A2509]">{error}</p>}
          <div className="flex-1" />
          <div className="flex flex-col items-center gap-2.5">
            <button
              onClick={phase === "listening" ? stop : start}
              disabled={phase === "working" || mode === "none"}
              aria-label={phase === "listening" ? "Stop and save" : "Start speaking"}
              className={`flex h-[88px] w-[88px] items-center justify-center rounded-full shadow-[0_8px_24px_rgba(15,107,74,0.35)] disabled:opacity-50 ${phase === "listening" ? "bg-overdue" : "bg-green"}`}
            >
              {phase === "listening" ? <StopIcon /> : <MicIcon />}
            </button>
            <span className="text-sm text-ink-2">
              {mode === "none" ? "Voice isn't available in this browser" : phase === "listening" ? "Tap when you finish" : "Tap and speak"}
            </span>
            <button onClick={() => setPhase("typing")} className="h-11 px-4 text-sm font-semibold text-green">
              Type it instead
            </button>
          </div>
        </>
      )}

      {phase === "typing" && (
        <form
          className="flex flex-1 flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim()) understand(typed.trim());
          }}
        >
          {error && <p role="alert" className="rounded-xl bg-overdue-bg px-4 py-3 text-sm text-[#7A2509]">{error}</p>}
          <label htmlFor="typed" className="text-[15px] font-semibold">Write it the way you would say it</label>
          <textarea
            id="typed"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            rows={4}
            placeholder="Mama Tunde don carry three bag rice, 18k. She go pay Friday."
            className="rounded-2xl border border-line bg-white p-4 text-base outline-none focus:border-green"
          />
          <div className="flex-1" />
          <button type="submit" className="h-14 rounded-2xl bg-green text-base font-semibold text-white">Continue</button>
          <button type="button" onClick={() => { setError(null); setPhase("idle"); }} className="h-12 rounded-[14px] border border-line bg-white text-sm font-semibold">
            Use my voice
          </button>
        </form>
      )}

      {phase === "confirm" && draft && (
        <>
          <div className="flex flex-col gap-2 rounded-[20px] bg-white p-[18px]">
            <span className="text-[13px] font-semibold text-green">I heard you say</span>
            <p className="text-[17px] font-medium leading-snug">“{heard}”</p>
          </div>
          <h2 className="text-[15px] font-semibold">Is this right?</h2>
          <div className="flex flex-col rounded-[20px] bg-white px-[18px] py-1.5">
            <Row label="Type">
              <select value={draft.type} onChange={(e) => set("type", e.target.value as EntryType)} className="field">
                <option value="sale">Sale</option>
                <option value="purchase">Bought stock</option>
                <option value="payment">Customer paid back</option>
              </select>
            </Row>
            {draft.type !== "payment" && (
              <Row label="Item">
                <input
                  value={[draft.quantity, draft.unit, draft.item].filter(Boolean).join(" ")}
                  onChange={(e) => {
                    const m = e.target.value.match(/^(\d+)\s+(\S+)\s+(.*)$/);
                    if (m) setDraft({ ...draft, quantity: +m[1], unit: m[2], item: m[3] });
                    else setDraft({ ...draft, quantity: null, unit: null, item: e.target.value });
                  }}
                  aria-label="Item"
                  className="field"
                />
              </Row>
            )}
            <Row label="Amount (₦)">
              <input inputMode="numeric" value={draft.amount ? draft.amount.toLocaleString("en-NG") : ""} onChange={(e) => set("amount", Number(e.target.value.replace(/\D/g, "")))} aria-label="Amount in naira" className="field" />
            </Row>
            <Row label={draft.type === "purchase" ? "Supplier" : "Customer"}>
              <input value={draft.party ?? ""} placeholder={draft.type === "sale" ? "Walk-in" : ""} onChange={(e) => set("party", e.target.value || null)} aria-label={draft.type === "purchase" ? "Supplier" : "Customer"} className="field" />
            </Row>
            <Row label="Payment" last={draft.payment !== "credit"}>
              <select value={draft.payment} onChange={(e) => set("payment", e.target.value as PaymentMethod)} aria-label="Payment" className="field">
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                {draft.type === "sale" && <option value="credit">Credit</option>}
              </select>
            </Row>
            {draft.payment === "credit" && (
              <Row label="Pay by" last>
                <input type="date" value={draft.dueDate ?? ""} onChange={(e) => set("dueDate", e.target.value || null)} aria-label="Pay by" className="field" />
              </Row>
            )}
          </div>
          {draft.payment === "credit" && draft.dueDate && (
            <p className="text-[13px] text-muted">Tally will remind you on {shortDate(draft.dueDate)} if it&apos;s not paid.</p>
          )}
          {draft.payment === "credit" && !draft.party && (
            <p role="alert" className="text-[13px] font-semibold text-overdue">Add who took it on credit, so you know who owes you.</p>
          )}
          <div className="flex-1" />
          <div className="flex flex-col gap-2.5">
            <button
              onClick={save}
              disabled={!draft.amount || (draft.payment === "credit" && !draft.party)}
              className="h-14 rounded-2xl bg-green text-base font-semibold text-white disabled:opacity-50"
            >
              Yes, save it
            </button>
            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={() => { setDraft(null); setHeard(""); setPhase("idle"); }} className="h-12 rounded-[14px] border border-line bg-white text-sm font-semibold">
                Say it again
              </button>
              <button onClick={() => { setTyped(heard); setPhase("typing"); }} className="h-12 rounded-[14px] border border-line bg-white text-sm font-semibold">
                Fix by typing
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-2 ${last ? "" : "border-b border-line-soft"}`}>
      <span className="shrink-0 text-sm text-muted">{label}</span>
      {children}
    </div>
  );
}
