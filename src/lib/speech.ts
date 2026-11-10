"use client";

/** Minimal typing for the browser's built-in speech recognition (Chrome, Edge, Safari). */
interface RecognitionResult { isFinal: boolean; 0: { transcript: string } }
interface RecognitionEvent { resultIndex: number; results: ArrayLike<RecognitionResult> }
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function browserSpeechAvailable() {
  return ctor() !== null;
}

export interface Listener {
  stop(): Promise<string>;
}

/** Live transcription in the browser. Nigerian English handles most Pidgin. */
export function listenInBrowser(onPartial: (text: string) => void, lang = "en-NG"): Listener {
  const C = ctor();
  if (!C) throw new Error("Speech recognition is not available in this browser.");
  const rec = new C();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = true;
  let finalText = "";
  let interim = "";
  let ended: () => void = () => {};
  const done = new Promise<void>((r) => (ended = r));
  rec.onresult = (e) => {
    interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript + " ";
      else interim += r[0].transcript;
    }
    onPartial((finalText + interim).trim());
  };
  rec.onerror = () => ended();
  rec.onend = () => ended();
  rec.start();
  return {
    async stop() {
      rec.stop();
      await Promise.race([done, new Promise((r) => setTimeout(r, 1500))]);
      return (finalText + interim).trim();
    },
  };
}

/** Record audio and send it to the server's speech model (e.g. NaijaVox). */
export async function recordForServer(): Promise<Listener> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.start();
  return {
    async stop() {
      const stopped = new Promise<void>((r) => (recorder.onstop = () => r()));
      recorder.stop();
      await stopped;
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      const res = await fetch("/api/transcribe", { method: "POST", headers: { "Content-Type": blob.type }, body: blob });
      if (!res.ok) throw new Error("Could not hear that. Try again or type it.");
      const { text } = (await res.json()) as { text: string };
      return text;
    },
  };
}
