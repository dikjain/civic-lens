from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .config import DATABASE_URL, DATABASE_URL_UNPOOLED


def make_engine(url: str):
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    # Neon: compute scales to zero and the pooler is PgBouncer, so ping before use, recycle idle
    # connections, and avoid server-side prepared statements (unsafe through a transaction pooler).
    return create_engine(url, pool_pre_ping=True, pool_recycle=300, pool_size=5, max_overflow=5,
                         connect_args={"prepare_threshold": None})


engine = make_engine(DATABASE_URL)  # app traffic (pooled)
admin_engine = make_engine(DATABASE_URL_UNPOOLED)  # DDL / schema creation (direct)
SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
