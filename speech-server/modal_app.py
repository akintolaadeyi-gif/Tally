"""
Tally speech server on Modal: a permanent web address, a GPU only while it's working.

One-time setup (on your Mac, inside speech-server/):
    pip3 install modal
    modal setup                                   # opens the browser to log in
    modal secret create tally-speech API_TOKEN=<a long random string>
    modal deploy modal_app.py

Modal prints a URL like https://<you>--tally-speech-web.modal.run
Put  TRANSCRIBE_URL=<that URL>/transcribe  and  TRANSCRIBE_TOKEN=<the same API_TOKEN>
in the Tally server's .env.local.

It scales to zero when idle (you pay nothing), and wakes on the next request. The first
entry after a quiet spell takes longer while NaijaVox loads onto the GPU.
"""

from pathlib import Path

import modal

HERE = Path(__file__).parent
MODEL_ID = "Axiveri/NaijaVox-2.0"

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install_from_requirements(str(HERE / "requirements.txt"))
    .env({"HF_HOME": "/models", "MODEL_ID": MODEL_ID})
    # Bake the 3 GB model into the image so waking up doesn't re-download it.
    .run_commands(f"python -c \"from huggingface_hub import snapshot_download; snapshot_download('{MODEL_ID}')\"")
    .add_local_file(str(HERE / "app.py"), "/root/app.py")
)

app = modal.App("tally-speech", image=image)


@app.function(
    gpu="T4",
    secrets=[modal.Secret.from_name("tally-speech")],
    scaledown_window=600,  # stay warm 10 minutes after the last entry
    timeout=120,
)
@modal.asgi_app()
def web():
    import sys

    sys.path.insert(0, "/root")
    from app import app as fastapi_app  # loads NaijaVox onto the GPU

    return fastapi_app
