# Tally mobile app (iOS and Android)

The same four screens as the web prototype, built with Expo (React Native) so one codebase runs on iPhone and Android.

## Try it on your phone today (no app store needed)

1. Install **Expo Go** from the App Store or Google Play.
2. Start the Tally server from the repo root so the app can transcribe and understand speech:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
3. In another terminal:
   ```bash
   cd mobile
   npm install
   cp .env.example .env.local      # set EXPO_PUBLIC_API_URL=http://<your-laptop-ip>:3000
   npx expo start
   ```
   Find your laptop's IP on a Mac with `ipconfig getifaddr en0`. Phone and laptop must be on the same Wi-Fi.
4. Scan the QR code: with the Camera app on iPhone, or inside Expo Go on Android.

On an empty phone, tap **Load sample data** to see the screens filled in.

What works where:
- **Typing an entry** works everywhere, even with no server (a simple built-in parser takes over).
- **Voice** needs the server *and* the NaijaVox speech server (`../speech-server/README.md`). Pick the language on
  the record screen (Pidgin, Yorùbá, Hausa, Igbo, English) before you speak.
- **Understanding messy sentences** is best with `ANTHROPIC_API_KEY` set on the server.

## Screens

| File | Screen |
| --- | --- |
| `src/app/index.tsx` | Today's sales, recent entries, mic button |
| `src/app/record.tsx` | Pick language, record, check and fix what Tally understood, save |
| `src/app/debts.tsx` | Who owes me, WhatsApp reminder, mark as paid |
| `src/app/business.tsx` | Business record towards supplier credit and loans |

`src/lib/` holds the ledger logic, shared in spirit with the web app (`../src/lib/`). The entries live on the phone
(AsyncStorage).

## Putting it in the App Store and Google Play

Use EAS, Expo's build service, so you don't need Xcode or Android Studio:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform all        # builds the iOS and Android apps in the cloud
npx eas-cli@latest submit --platform ios        # needs an Apple Developer account ($99/year)
npx eas-cli@latest submit --platform android    # needs a Google Play developer account ($25 once)
```

Before submitting, deploy the Tally server somewhere public (Vercel works) and set `EXPO_PUBLIC_API_URL` to it,
and replace the placeholder app icon in `assets/`. The bundle ID is `com.tally.app` in `app.json`; change it to
one you own (e.g. `com.yourname.tally`) before the first store build, because it can't be changed afterwards.
