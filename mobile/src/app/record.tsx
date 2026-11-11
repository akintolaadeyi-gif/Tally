import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from "expo-audio";
import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Button, MicIcon, ScreenHeader, StopIcon, s } from "@/components/ui";
import { parseEntry, transcribe } from "@/lib/api";
import { shortDate } from "@/lib/format";
import { LANGUAGES, useLanguage } from "@/lib/settings";
import { addEntry } from "@/lib/store";
import { c, f } from "@/lib/theme";
import type { Draft, EntryType, PaymentMethod } from "@/lib/types";

type Phase = "idle" | "listening" | "working" | "confirm" | "typing";

// One channel is all speech needs. The default preset records stereo from two iPhone mics,
// and mixing those down can cancel the voice out.
const VOICE_PRESET = { ...RecordingPresets.HIGH_QUALITY, numberOfChannels: 1 };

type Recorder = ReturnType<typeof useAudioRecorder>;

/**
 * When a Bluetooth speaker, earpiece or car kit is connected, phones record through ITS mic,
 * which may be across the room. Switch to the phone's own mic and tell the trader.
 */
async function preferPhoneMic(recorder: Recorder): Promise<string | null> {
  try {
    const current = await recorder.getCurrentInput();
    if (!/bluetooth|car/i.test(current.type)) return null;
    const builtIn = recorder.getAvailableInputs().find((i) => /builtin/i.test(i.type));
    if (builtIn) {
      recorder.setInput(builtIn.uid);
      return `${current.name} is connected, so I'm using your phone's own mic. Speak close to your phone.`;
    }
    return `I'm recording through ${current.name}. If it's far from you, disconnect it or move closer to it.`;
  } catch {
    return null; // Not every phone reports its inputs; record as normal.
  }
}

export default function RecordScreen() {
  const recorder = useAudioRecorder(VOICE_PRESET);
  const [language, setLanguage] = useLanguage();
  const [phase, setPhase] = useState<Phase>("idle");
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [micNote, setMicNote] = useState<string | null>(null);

  async function start() {
    setError(null);
    setHeard("");
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setError("Tally needs the microphone to hear you. You can type the entry instead.");
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    setMicNote(await preferPhoneMic(recorder));
    recorder.record();
    setPhase("listening");
  }

  async function stop() {
    setPhase("working");
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      if (!recorder.uri) throw new Error("Nothing was recorded. Try again.");
      const text = await transcribe(recorder.uri, language);
      if (!text) throw new Error("Tally didn't catch that. Try again, a little closer to the phone.");
      await understand(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("idle");
    }
  }

  async function understand(text: string) {
    setPhase("working");
    setHeard(text);
    setDraft(await parseEntry(text));
    setPhase("confirm");
  }

  function save() {
    if (!draft) return;
    addEntry(draft);
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const needsCustomer = draft?.payment === "credit" && !draft.party;

  if (phase === "confirm" && draft) {
    return (
      <Screen
        footer={
          <>
            <Button label="Yes, save it" onPress={save} disabled={!draft.amount || needsCustomer} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button label="Say it again" kind="secondary" style={{ flex: 1 }} onPress={() => { setDraft(null); setHeard(""); setPhase("idle"); }} />
              <Button label="Fix by typing" kind="secondary" style={{ flex: 1 }} onPress={() => { setTyped(heard); setPhase("typing"); }} />
            </View>
          </>
        }
      >
        <ScreenHeader title="New entry" />
        <View style={[s.card, { gap: 8 }]}>
          <Text style={st.label}>I heard you say</Text>
          <Text style={st.quote}>“{heard}”</Text>
        </View>
        <Text style={s.h2}>Is this right?</Text>
        <View style={[s.card, { paddingVertical: 6 }]}>
          <Row label="Type">
            <Chips<EntryType>
              value={draft.type}
              options={[["sale", "Sale"], ["purchase", "Bought"], ["payment", "Paid back"]]}
              onChange={(v) => setDraft({ ...draft, type: v, payment: v === "sale" ? draft.payment : draft.payment === "credit" ? "cash" : draft.payment })}
            />
          </Row>
          {draft.type !== "payment" && (
            <Row label="Item">
              <TextInput
                style={st.field}
                accessibilityLabel="Item"
                value={[draft.quantity, draft.unit, draft.item].filter(Boolean).join(" ")}
                onChangeText={(t) => {
                  const m = t.match(/^(\d+)\s+(\S+)\s+(.*)$/);
                  if (m) setDraft({ ...draft, quantity: +m[1], unit: m[2], item: m[3] });
                  else setDraft({ ...draft, quantity: null, unit: null, item: t });
                }}
              />
            </Row>
          )}
          <Row label="Amount (₦)">
            <TextInput
              style={st.field}
              accessibilityLabel="Amount in naira"
              keyboardType="number-pad"
              value={draft.amount ? draft.amount.toLocaleString("en-NG") : ""}
              onChangeText={(t) => set("amount", Number(t.replace(/\D/g, "")))}
            />
          </Row>
          <Row label={draft.type === "purchase" ? "Supplier" : "Customer"}>
            <TextInput
              style={st.field}
              accessibilityLabel={draft.type === "purchase" ? "Supplier" : "Customer"}
              placeholder={draft.type === "sale" ? "Walk-in" : ""}
              placeholderTextColor={c.muted}
              value={draft.party ?? ""}
              onChangeText={(t) => set("party", t || null)}
            />
          </Row>
          <Row label="Payment" last={draft.payment !== "credit"}>
            <Chips<PaymentMethod>
              value={draft.payment}
              options={draft.type === "sale" ? [["cash", "Cash"], ["transfer", "Transfer"], ["credit", "Credit"]] : [["cash", "Cash"], ["transfer", "Transfer"]]}
              onChange={(v) => set("payment", v)}
            />
          </Row>
          {draft.payment === "credit" && (
            <Row label="Pay by" last>
              <TextInput
                style={st.field}
                accessibilityLabel="Pay by date"
                placeholder="YYYY-MM-DD"
                placeholderTextColor={c.muted}
                value={draft.dueDate ?? ""}
                onChangeText={(t) => set("dueDate", /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : t || null)}
              />
            </Row>
          )}
        </View>
        {draft.payment === "credit" && draft.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(draft.dueDate) && (
          <Text style={s.muted}>Due {shortDate(draft.dueDate)}. It shows on “Who owes me” until it&apos;s paid.</Text>
        )}
        {needsCustomer && <Text style={st.warn}>Add who took it on credit, so you know who owes you.</Text>}
      </Screen>
    );
  }

  if (phase === "typing") {
    return (
      <Screen
        footer={
          <>
            <Button label="Continue" onPress={() => typed.trim() && understand(typed.trim())} disabled={!typed.trim()} />
            <Button label="Use my voice" kind="secondary" onPress={() => { setError(null); setPhase("idle"); }} />
          </>
        }
      >
        <ScreenHeader title="New entry" />
        {error && <Text style={st.error}>{error}</Text>}
        <Text style={s.h2}>Write it the way you would say it</Text>
        <TextInput
          style={st.textarea}
          multiline
          autoFocus
          value={typed}
          onChangeText={setTyped}
          placeholder="Mama Tunde don carry three bag rice, 18k. She go pay Friday."
          placeholderTextColor={c.muted}
          accessibilityLabel="Entry"
        />
      </Screen>
    );
  }

  const listening = phase === "listening";
  return (
    <Screen
      footer={
        <View style={{ alignItems: "center", gap: 10 }}>
          <Pressable
            onPress={listening ? stop : start}
            disabled={phase === "working"}
            accessibilityRole="button"
            accessibilityLabel={listening ? "Stop" : "Start speaking"}
            style={[st.mic, listening && { backgroundColor: c.overdue }, phase === "working" && { opacity: 0.5 }]}
          >
            {phase === "working" ? <ActivityIndicator color={c.white} size="large" /> : listening ? <StopIcon /> : <MicIcon />}
          </Pressable>
          <Text style={[s.body, { fontSize: 14 }]}>{listening ? "Tap when you finish" : phase === "working" ? "Writing it down…" : "Tap and speak"}</Text>
          <Button label="Type it instead" kind="link" onPress={() => setPhase("typing")} />
        </View>
      }
    >
      <ScreenHeader title="New entry" />
      <View style={{ gap: 8 }}>
        <Text style={s.muted}>I&apos;ll listen for</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {LANGUAGES.map((l) => (
            <Pressable
              key={l.id}
              onPress={() => setLanguage(l.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: language === l.id }}
              style={[st.chip, language === l.id && st.chipOn]}
            >
              <Text style={[st.chipText, language === l.id && { color: c.white }]}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={[s.card, { gap: 12, minHeight: 140 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={[st.dot, listening && { backgroundColor: c.overdue }]} />
          <Text style={st.label}>{listening ? "Listening…" : phase === "working" ? "Writing it down…" : "Ready"}</Text>
        </View>
        <Text style={st.quote}>
          {listening ? "Say what you sold, to who, how much, and how they paid." : "Example: “Mama Tunde don carry three bag rice, 18k. She go pay Friday.”"}
        </Text>
      </View>
      {micNote && (
        <Text style={st.note} accessibilityRole="alert">
          {micNote}
        </Text>
      )}
      {error && <Text style={st.error}>{error}</Text>}
    </Screen>
  );
}

function Row({ label, children, last }: { label: string; children: ReactNode; last?: boolean }) {
  return (
    <View style={[st.row, !last && { borderBottomWidth: 1, borderBottomColor: c.lineSoft }]}>
      <Text style={st.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Chips<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 6, flexShrink: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
      {options.map(([v, label]) => (
        <Pressable key={v} onPress={() => onChange(v)} accessibilityRole="radio" accessibilityState={{ selected: v === value }} style={[st.chip, st.chipSmall, v === value && st.chipOn]}>
          <Text style={[st.chipText, v === value && { color: c.white }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  label: { fontFamily: f.semibold, fontSize: 13, color: c.green },
  quote: { fontFamily: f.medium, fontSize: 18, lineHeight: 26, color: c.ink },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.green },
  mic: { width: 88, height: 88, borderRadius: 44, backgroundColor: c.green, alignItems: "center", justifyContent: "center", shadowColor: c.green, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  error: { backgroundColor: c.overdueBg, color: c.overdueInk, borderRadius: 12, padding: 14, fontFamily: f.regular, fontSize: 14 },
  note: { backgroundColor: c.amberBg, color: c.amberInk, borderRadius: 12, padding: 14, fontFamily: f.regular, fontSize: 14, lineHeight: 20 },
  warn: { color: c.overdue, fontFamily: f.semibold, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 10, minHeight: 52 },
  rowLabel: { flexShrink: 0, fontFamily: f.regular, fontSize: 14, color: c.muted },
  field: { flex: 1, textAlign: "right", fontFamily: f.semibold, fontSize: 15, color: c.ink, paddingVertical: 6 },
  textarea: { minHeight: 120, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 16, fontFamily: f.regular, fontSize: 16, color: c.ink, textAlignVertical: "top" },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: c.line, backgroundColor: c.white, justifyContent: "center" },
  chipSmall: { minHeight: 40, paddingHorizontal: 10, borderRadius: 20 },
  chipOn: { backgroundColor: c.green, borderColor: c.green },
  chipText: { fontFamily: f.semibold, fontSize: 13, color: c.ink },
});
