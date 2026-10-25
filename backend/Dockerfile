# ──────────────────────────────────────────────────────────────────────────────
#  Backend Dockerfile — FastAPI + Python 3.11
# ──────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

LABEL maintainer="TruthLens Team"
LABEL description="Cross-Lingual Multimodal Fact Verification Backend (FastAPI)"

# System deps for EasyOCR, Pillow, and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY data/ ./data/
COPY .env.example .env

EXPOSE 8000

# Run with uvicorn in production mode
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--log-level", "info"]
