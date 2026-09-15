"""CIVIC PULSE — Database connection and session management."""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Use SQLite for prototype simplicity (PostGIS can be swapped in)
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.use_sqlite else {},
    echo=False,
)

# Enable spatialite extension for SQLite if needed
if settings.use_sqlite:
    @event.listens_for(engine, "connect")
    def connect(dbapi_connection, connection_record):
        dbapi_connection.enable_load_extension(True)
        try:
            dbapi_connection.load_extension("mod_spatialite")
        except Exception:
            pass  # SpatiaLite not available, will use raw lat/lng
        dbapi_connection.enable_load_extension(False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for FastAPI route database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)
