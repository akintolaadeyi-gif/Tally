# Tally

Speak your sales. Tally keeps the book.

Tally is a voice-first bookkeeper for Nigerian market traders. A trader taps the mic and says something like
*"Mama Tunde don carry three bag rice, 18k. She go pay Friday."* Tally turns it into a ledger entry, keeps
track of who owes what, and builds a business record that can later unlock supplier credit and loans.

This is the first working prototype. Everything is stored on the phone; there are no accounts yet.

## What's in this repo

| Folder | What it is |
| --- | --- |
| `/` (root) | The Next.js web app **and** the Tally server: `/api/transcribe` (speech) and `/api/parse` (understanding) |
| `mobile/` | The iOS and Android app (Expo). See `mobile/README.md` |
| `speech-server/` | NaijaVox 2.0 speech-to-text for Pidgin, Yoruba, Hausa, Igbo and Nigerian English. See `speech-server/README.md` |

## Screens

| Route | What it does |
| --- | --- |
| `/` | Today's sales (cash and transfer vs credit), recent entries, the mic button |
| `/record` | Speak or type an entry, check what Tally understood, fix it, save it |
| `/debts` | Who owes you, overdue first, with a WhatsApp reminder and "Mark as paid" |
| `/business` | Days recorded towards 90, average weekly sales, on-time payment rate, what the record unlocks |

On an empty phone, the home screen offers **Load sample data** so you can demo it straight away.

## Run it

```bash
npm install
cp .env.example .env.local   # both keys are optional
npm run dev                  # open http://localhost:3000 on your phone or in a phone-sized browser window
```

To try it on a real phone on the same Wi-Fi, run `npm run dev -- -H 0.0.0.0` and open `http://<your-laptop-ip>:3000`.
Browsers only allow the microphone on `localhost` or HTTPS, so for a real phone either deploy it (Vercel works out of the box)
or use a tunnel such as `npx localtunnel --port 3000`.

## How the voice pipeline works

1. **Speech to text** (`src/lib/speech.ts`, `src/app/api/transcribe/route.ts`)
   - If `TRANSCRIBE_URL` is set, the app records audio and sends it to Tally's speech server (`speech-server/`), which runs
     [NaijaVox 2.0](https://huggingface.co/Axiveri/NaijaVox-2.0), an open Whisper-based model for Pidgin, Yoruba, Hausa,
     Igbo and Nigerian English.
   - Otherwise it uses the browser's built-in speech recognition set to Nigerian English, which handles a lot of Pidgin
     but not Yoruba.
   - Typing is always available as a fallback.
2. **Text to ledger entry** (`src/app/api/parse/route.ts`, `src/lib/parseSchema.ts`)
   - With `ANTHROPIC_API_KEY`, Claude (`claude-opus-5-5`, low effort) fills a strict JSON schema: type, item, quantity,
     amount, customer or supplier, payment method and due date. The prompt includes Pidgin and Yoruba hints.
     Server-side refusal fallbacks are switched on, so a declined request is retried on a fallback model automatically.
   - Without a key, or if the API is unreachable, a rule-based parser (`src/lib/fallbackParse.ts`) takes over.
3. **The trader confirms.** Nothing is saved until they tap "Yes, save it", and every field can be corrected.
   The original words are kept with each entry.

## Code map

- `src/lib/types.ts`: the `Entry` shape
- `src/lib/store.ts`: on-device storage
- `src/lib/ledger.ts`: today's totals, debts (payments applied oldest first), business record
- `src/lib/sample.ts`: demo data
- `src/components/ui.tsx`: shared pieces (mic, header, tags, entry row)
- Colours and fonts match the Tally starter style: market green `#0F6B4A`, credit amber, Space Grotesk and Inter.

## Not built yet

- Testing NaijaVox on real market recordings (noise, mixing languages in one sentence), then fine-tuning it on Tally's own data
- Voice-note reminders in the trader's own voice (today the reminder is a prefilled WhatsApp text)
- Accounts and cloud backup, so the record survives a lost phone and can be shared with a lender with consent
- Stock levels, and a supplier view
