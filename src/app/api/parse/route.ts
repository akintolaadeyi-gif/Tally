import Anthropic from "@anthropic-ai/sdk";
import { fallbackParse } from "@/lib/fallbackParse";
import { ENTRY_SCHEMA, systemPrompt } from "@/lib/parseSchema";
import type { Draft } from "@/lib/types";

const MODEL = "claude-opus-5-5";

export async function POST(request: Request) {
  const { text, today } = (await request.json()) as { text?: string; today?: string };
  if (!text || !text.trim()) {
    return Response.json({ error: "Nothing was said." }, { status: 400 });
  }
  const transcript = text.trim();

  // No key configured: use the simple rule-based parser so the demo still works.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ draft: fallbackParse(transcript), source: "rules" });
  }

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: ENTRY_SCHEMA },
      },
      system: systemPrompt(today ?? new Date().toISOString().slice(0, 10)),
      messages: [{ role: "user", content: transcript }],
    });

    if (response.stop_reason === "refusal") {
      return Response.json({ draft: fallbackParse(transcript), source: "rules" });
    }
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error("No text in response");
    const parsed = JSON.parse(block.text) as Omit<Draft, "transcript"> & { confident: boolean };
    const { confident, ...fields } = parsed;
    const draft: Draft = { ...fields, amount: Math.round(fields.amount), transcript };
    return Response.json({ draft, source: "claude", confident });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.APIConnectionError) {
      // Network or busy: fall back rather than lose the trader's entry.
      return Response.json({ draft: fallbackParse(transcript), source: "rules" });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Claude API error", err.status, err.message);
      return Response.json({ draft: fallbackParse(transcript), source: "rules" });
    }
    console.error(err);
    return Response.json({ error: "Could not understand that entry." }, { status: 500 });
  }
}
