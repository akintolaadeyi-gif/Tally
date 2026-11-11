# Runs on a GPU box (recommended) or CPU (works, but a few seconds slower per entry).
FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
# Hugging Face Spaces expects port 7860.
ENV PORT=7860 HF_HOME=/app/.cache
RUN mkdir -p /app/.cache && chmod 777 /app/.cache
EXPOSE 7860
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
