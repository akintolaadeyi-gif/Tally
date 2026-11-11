/**
 * Speech to text. Forwards the recorded audio to Tally's speech server
 * (speech-server/, running NaijaVox 2.0 for Pidgin, Yoruba, Hausa, Igbo and
 * Nigerian English) and returns { text }.
 *
 * Set TRANSCRIBE_URL to the server's /transcribe address (and TRANSCRIBE_TOKEN
 * if you set API_TOKEN on the server). Pass ?language=pidgin|yoruba|hausa|igbo|nigerian_english.
 * When unset, GET reports "browser" and the app falls back to the browser's
 * own speech recognition, or typing.
 */
export async function GET() {
  return Response.json({ mode: process.env.TRANSCRIBE_URL ? "server" : "browser" });
}

export async function POST(request: Request) {
  const url = process.env.TRANSCRIBE_URL;
  if (!url) return Response.json({ error: "No speech model configured." }, { status: 501 });

  const language = new URL(request.url).searchParams.get("language") ?? "pidgin";
  const target = new URL(url);
  target.searchParams.set("language", language);

  const audio = await request.arrayBuffer();
  const res = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "audio/webm",
      ...(process.env.TRANSCRIBE_TOKEN ? { Authorization: `Bearer ${process.env.TRANSCRIBE_TOKEN}` } : {}),
    },
    body: audio,
  });
  if (!res.ok) {
    return Response.json({ error: `Speech model returned ${res.status}` }, { status: 502 });
  }
  // HF ASR endpoints return { text } (or [{ text }] for some pipelines).
  const data = (await res.json()) as { text?: string } | { text?: string }[];
  const text = Array.isArray(data) ? data[0]?.text : data.text;
  return Response.json({ text: (text ?? "").trim() });
}
