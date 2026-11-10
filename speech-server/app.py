"""
Tally speech server: NaijaVox 2.0 speech-to-text over HTTP.

NaijaVox 2.0 (Axiveri/NaijaVox-2.0, Apache-2.0) is Whisper large-v3 fine-tuned
for Yoruba, Hausa, Igbo, Nigerian Pidgin and Nigerian English.

POST /transcribe?language=pidgin   body = raw audio (webm, m4a, wav, mp3...)
  -> {"text": "...", "language": "pidgin", "seconds": 1.8}
GET  /health -> {"ok": true, "device": "cuda"}

Set API_TOKEN to require "Authorization: Bearer <token>" on /transcribe.
"""

import os
import subprocess
import time

import numpy as np
import torch
from fastapi import FastAPI, HTTPException, Request
from transformers import WhisperForConditionalGeneration, WhisperProcessor

MODEL_ID = os.environ.get("MODEL_ID", "Axiveri/NaijaVox-2.0")
API_TOKEN = os.environ.get("API_TOKEN")
SAMPLE_RATE = 16_000
MAX_SECONDS = 30  # Whisper hears 30 seconds at a time; one ledger entry is far shorter.

# Language name -> Whisper language token, as listed on the NaijaVox model card.
LANG_TOKENS = {
    "pidgin": "<|pcm|>",
    "yoruba": "<|yo|>",
    "hausa": "<|ha|>",
    "igbo": "<|ig|>",
    "nigerian_english": "<|en|>",
}

device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32

processor = WhisperProcessor.from_pretrained(MODEL_ID)
model = WhisperForConditionalGeneration.from_pretrained(MODEL_ID, dtype=dtype).to(device).eval()
tokenizer = processor.tokenizer


def token_id(token: str) -> int:
    tid = tokenizer.convert_tokens_to_ids(token)
    if tid is None or tid == tokenizer.unk_token_id:
        raise RuntimeError(f"Token {token} missing from the NaijaVox tokenizer")
    return tid


PROMPT_START = [token_id("<|startoftranscript|>")]
PROMPT_END = [token_id("<|transcribe|>"), token_id("<|notimestamps|>")]
LANG_IDS = {name: token_id(tok) for name, tok in LANG_TOKENS.items()}


def decode_audio(data: bytes) -> np.ndarray:
    """Any container/codec a phone produces -> 16 kHz mono float32, via ffmpeg."""
    proc = subprocess.run(
        ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", "pipe:0",
         "-ac", "1", "-ar", str(SAMPLE_RATE), "-f", "f32le", "pipe:1"],
        input=data, capture_output=True, check=False,
    )
    if proc.returncode != 0:
        raise HTTPException(400, f"Could not read audio: {proc.stderr.decode()[:200]}")
    audio = np.frombuffer(proc.stdout, dtype=np.float32)
    return audio[: SAMPLE_RATE * MAX_SECONDS]


app = FastAPI(title="Tally speech server")


@app.get("/health")
def health():
    return {"ok": True, "device": device, "model": MODEL_ID}


@app.post("/transcribe")
async def transcribe(request: Request, language: str = "pidgin"):
    if API_TOKEN and request.headers.get("authorization") != f"Bearer {API_TOKEN}":
        raise HTTPException(401, "Bad token")
    if language not in LANG_IDS:
        raise HTTPException(400, f"language must be one of {sorted(LANG_IDS)}")

    audio = decode_audio(await request.body())
    if audio.size < SAMPLE_RATE * 0.3:
        return {"text": "", "language": language, "seconds": 0}

    started = time.time()
    features = processor(audio, sampling_rate=SAMPLE_RATE, return_tensors="pt").input_features
    prompt = torch.tensor([PROMPT_START + [LANG_IDS[language]] + PROMPT_END], device=device)
    with torch.inference_mode():
        out = model.generate(features.to(device, dtype), decoder_input_ids=prompt, max_new_tokens=440)
    text = tokenizer.decode(out[0], skip_special_tokens=True).strip()
    return {"text": text, "language": language, "seconds": round(time.time() - started, 2)}
