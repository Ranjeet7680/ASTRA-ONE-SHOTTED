import os
import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import uvicorn

from backend.config import settings
from backend.database import init_db, get_db
from backend.routers import (
    auth_router,
    player_router,
    weapons_router,
    loadouts_router,
    inventory_router,
    matchmaking_router,
    matches_router,
    ws_matches_router,
    missions_router,
    ranking_router,
    rewards_router,
    social_router,
    analytics_router,
    ml_router,
    admin_router,
    ai_router
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Scalable Backend & Machine Learning Telemetry Platform for ASTRA: One Shotted mobile FPS",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router)
app.include_router(player_router)
app.include_router(weapons_router)
app.include_router(loadouts_router)
app.include_router(inventory_router)
app.include_router(matchmaking_router)
app.include_router(matches_router)
app.include_router(ws_matches_router)
app.include_router(missions_router)
app.include_router(ranking_router)
app.include_router(rewards_router)
app.include_router(social_router)
app.include_router(analytics_router)
app.include_router(ml_router)
app.include_router(admin_router)
app.include_router(ai_router)

# Mount Admin Dashboard static files
ADMIN_DIR = Path(__file__).resolve().parent / "admin"
if ADMIN_DIR.exists():
    app.mount("/admin", StaticFiles(directory=str(ADMIN_DIR), html=True), name="admin")

@app.on_event("startup")
def on_startup():
    print("[INIT] Initializing database tables and models...")
    init_db()
    print("[INIT] ASTRA: One Shotted Backend successfully started!")

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "game": "ASTRA: One Shotted",
        "version": settings.VERSION,
        "database": "SQLite (Persistent)",
        "ml_pipeline": "Active (5 Models Loaded)"
    }

@app.get("/")
def root():
    return {
        "message": "ASTRA: One Shotted - Authoritative Game & ML Server",
        "admin_portal": "/admin",
        "api_docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=False)
