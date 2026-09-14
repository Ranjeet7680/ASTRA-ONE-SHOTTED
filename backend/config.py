import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    PROJECT_NAME: str = "ASTRA: One Shotted - Modular FPS Backend"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration (SQLite by default for zero-setup native execution)
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'astra_game.db'}")
    
    # JWT Secrets & Expiry
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "astra_tactical_super_secret_blueprint_jwt_key_2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours for mobile convenience
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Admin API Key
    ADMIN_API_KEY: str = os.getenv("ADMIN_API_KEY", "astra_admin_master_blueprint_key")
    
    # ML Models directory
    ML_MODELS_DIR: Path = BASE_DIR / "ml" / "models"
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 180

settings = Settings()
