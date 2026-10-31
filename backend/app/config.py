import os
from pathlib import Path


def _load_env_file():
    """Load KEY=VALUE pairs from the project-root .env.local / .env (written by `neon deploy`) without overriding real env vars."""
    root = Path(__file__).resolve().parents[2]
    for name in (".env.local", ".env"):
        f = root / name
        if f.exists():
            for line in f.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            return


_load_env_file()


def _sqlalchemy_url(url: str) -> str:
    """Neon gives postgresql://...; SQLAlchemy needs the psycopg (v3) driver name."""
    for old in ("postgresql://", "postgres://"):
        if url.startswith(old):
            return "postgresql+psycopg://" + url[len(old):]
    return url


# Pooled URL (PgBouncer) for app traffic; unpooled URL for schema creation (DDL).
DATABASE_URL = _sqlalchemy_url(os.getenv("DATABASE_URL", "sqlite:///./civiclens.db"))
DATABASE_URL_UNPOOLED = DATABASE_URL if DATABASE_URL.startswith("sqlite") else (
    _sqlalchemy_url(os.getenv("DATABASE_URL_UNPOOLED", "")) or DATABASE_URL)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me-please-use-32+chars")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MODEL_PATH = os.getenv("MODEL_PATH", "../ml/model.keras")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.6"))
MAX_UPLOAD_BYTES = 8 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
CATEGORIES = ["pothole", "garbage", "water_leak", "other"]
STATUSES = ["submitted", "under_review", "assigned", "in_progress", "resolved", "rejected"]
