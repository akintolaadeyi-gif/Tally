# Tally speech server (NaijaVox 2.0)

A small HTTP server that turns a trader's voice into text with
[NaijaVox 2.0](https://huggingface.co/Axiveri/NaijaVox-2.0), an open model (Apache-2.0) built on Whisper large-v3
and fine-tuned for **Nigerian Pidgin, Yoruba, Hausa, Igbo and Nigerian English**.

```
POST /transcribe?language=pidgin     body: raw audio (m4a from phones, webm from browsers, wav, mp3)
  -> {"text": "Mama Tunde don carry three bag rice...", "language": "pidgin", "seconds": 1.4}
GET  /health
```

`language` is one of `pidgin`, `yoruba`, `hausa`, `igbo`, `nigerian_english`. Telling the model the language
noticeably improves accuracy, which is why the app lets the trader pick one.

## Permanent home: Modal (recommended)

[Modal](https://modal.com) runs the server on a GPU only while it's transcribing, and gives it a fixed address.
Its free monthly credit covers testing and small pilots. See `modal_app.py` for the steps:
`pip3 install modal`, `modal setup`, `modal secret create tally-speech API_TOKEN=...`, then
`modal deploy modal_app.py`. It sleeps after 10 idle minutes, so the first entry after a break is slower.

## Free way to test it: Google Colab or Kaggle

Hugging Face now charges for Docker Spaces. For testing, open `tally_speech_colab.ipynb` in
[Google Colab](https://colab.research.google.com) (File → Upload notebook), pick **Runtime → Change runtime type →
T4 GPU**, then **Run all**. The last cell prints `TRANSCRIBE_URL` and `TRANSCRIBE_TOKEN` for `.env.local`. The address
changes every time Colab restarts, so this suits testing and demos, not real users.

## Hosting it for real users: a Hugging Face Space (paid)

1. Create an account at huggingface.co (Docker Spaces need a PRO plan), then **New Space** → SDK **Docker** → name it e.g. `tally-speech`.
2. Upload the three files in this folder (`app.py`, `requirements.txt`, `Dockerfile`) to the Space.
3. In the Space **Settings**:
   - **Hardware:** the free CPU works for testing but takes several seconds per entry. A small GPU (T4) makes it
     feel instant; it is billed by the hour, so check the current price and set it to sleep when idle.
   - **Variables and secrets:** add a secret `API_TOKEN` with any long random string.
4. Wait for the build (the first start downloads the 3 GB model). Open `https://<you>-tally-speech.hf.space/health`
   to check it's up.
5. In the Tally server's `.env.local` set:
   ```
   TRANSCRIBE_URL=https://<you>-tally-speech.hf.space/transcribe
   TRANSCRIBE_TOKEN=<the same API_TOKEN>
   ```

Any machine with Docker works too: `docker build -t tally-speech . && docker run -p 7860:7860 --gpus all tally-speech`.

## Run it locally (Mac or Linux, Python 3.11)

```bash
cd speech-server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt   # also needs ffmpeg: brew install ffmpeg
uvicorn app:app --port 7860
```

On a laptop without a GPU it runs on the CPU: slower, but fine for trying it out.

## Making it smarter over time

The plan is to fine-tune NaijaVox on Tally's own data. Every entry keeps the trader's original words, and every
correction on the "Is this right?" screen is a labelled example. Once traders agree to share recordings,
a few dozen hours of real market audio should help most with noise, mixing languages in one sentence, and trade words
("bag", "carton", "balance").
