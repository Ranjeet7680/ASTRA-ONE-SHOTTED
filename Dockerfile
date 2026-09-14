# Multi-stage production container for ASTRA: One Shotted (Game Engine + FastAPI + PyTorch AI Platform)

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# Stage 2: Python Runtime with PyTorch & AI Platform
FROM python:3.11-slim AS production

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt || \
    pip install --no-cache-dir \
    fastapi==0.111.0 \
    uvicorn==0.30.1 \
    pydantic==2.7.4 \
    sqlalchemy==2.0.31 \
    scikit-learn==1.5.0 \
    xgboost==3.2.0 \
    joblib==1.4.2 \
    torch==2.1.0 --index-url https://download.pytorch.org/whl/cpu \
    websockets==12.0 \
    python-jose==3.3.0 \
    passlib==1.7.4 \
    bcrypt==4.1.3 \
    httpx==0.27.0 \
    numpy==1.26.4

# Copy project files
COPY backend ./backend
COPY ml ./ml
COPY shared ./shared
COPY astra_game.db ./astra_game.db

# Copy built frontend assets to static root
COPY --from=frontend-builder /app/dist ./dist

# Initialize/seed database & train models if not already present
RUN python backend/seed.py && python ml/training/train_all.py

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
