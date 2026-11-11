import { fallbackParse } from "./fallbackParse";
import { todayISO } from "./format";
import type { Draft } from "./types";

/**
 * The Tally server (the Next.js app at the repo root) does the heavy lifting:
 * /api/transcribe forwards audio to the NaijaVox speech server and
 * /api/parse turns words into a ledger entry with Claude.
 * Set EXPO_PUBLIC_API_URL in mobile/.env, e.g. http://192.168.1.20:3000
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export type SpeechLanguage = "pidgin" | "yoruba" | "hausa" | "igbo" | "nigerian_english";

export async function transcribe(fileUri: string, language: SpeechLanguage): Promise<string> {
  if (!API_URL) throw new Error("Voice needs the Tally server. Set EXPO_PUBLIC_API_URL, or type the entry for now.");
  const audio = await (await fetch(fileUri)).blob();
  const res = await fetch(`${API_URL}/api/transcribe?language=${language}`, {
    method: "POST",
    headers: { "Content-Type": audio.type || "audio/m4a" },
    body: audio,
  });
  if (res.status === 501) throw new Error("The speech model isn't set up on the server yet. Type the entry for now.");
  if (!res.ok) throw new Error("Tally couldn't hear that clearly. Try again, or type it.");
  const { text } = (await res.json()) as { text: string };
  return text;
}

export async function parseEntry(text: string): Promise<Draft> {
  if (!API_URL) return fallbackParse(text);
  try {
    const res = await fetch(`${API_URL}/api/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, today: todayISO() }),
    });
    const data = (await res.json()) as { draft?: Draft };
    return data.draft ?? fallbackParse(text);
  } catch {
    // Offline in the market: the simple parser still gets the entry down.
    return fallbackParse(text);
  }
}
