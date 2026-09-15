"""CIVIC PULSE — FastAPI Application Entry Point.

Urban Infrastructure Intelligence & Decision Platform
SEE THE PROBLEM. SIMULATE THE RESPONSE. PROVE THE OUTCOME.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.database import init_db, SessionLocal
from app.api import incidents, infrastructure, simulations, decisions, work_orders, verification, insights


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    # Initialize database tables
    init_db()

    # Seed data if database is empty
    db = SessionLocal()
    try:
        from app.models.models import Incident
        count = db.query(Incident).count()
        if count == 0:
            print("📦 Empty database detected — running seed...")
            from app.database.seed import run_seed
            run_seed(db)
        else:
            print(f"✅ Database has {count} incidents — skipping seed.")
    except Exception as e:
        print(f"⚠️ Seed check error: {e}")
    finally:
        db.close()

    yield  # Application running

    # Shutdown
    print("👋 CIVIC PULSE shutting down.")


app = FastAPI(
    title="CIVIC PULSE",
    description="Urban Infrastructure Intelligence & Decision Platform — "
                "SEE THE PROBLEM. SIMULATE THE RESPONSE. PROVE THE OUTCOME.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for evidence images
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_dir):
    app.mount("/images", StaticFiles(directory=os.path.join(static_dir, "images")), name="images")

# Mount API routers
app.include_router(incidents.router)
app.include_router(infrastructure.router)
app.include_router(simulations.router)
app.include_router(decisions.router)
app.include_router(work_orders.router)
app.include_router(verification.router)
app.include_router(insights.router)


@app.get("/")
def root():
    return {
        "name": "CIVIC PULSE",
        "tagline": "SEE THE PROBLEM. SIMULATE THE RESPONSE. PROVE THE OUTCOME.",
        "version": "0.1.0",
        "status": "operational",
        "data": "prototype/synthetic",
    }


@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "civic-pulse-backend"}


@app.get("/api/status")
def system_status():
    """System operational status for the top bar."""
    db = SessionLocal()
    try:
        from app.models.models import Incident, WorkOrder, InfrastructureAsset
        return {
            "system": "OPERATIONAL",
            "region": "PUNE",
            "data_mode": "DEMO DATA",
            "active_incidents": db.query(Incident).filter(
                Incident.status.in_(["DETECTED", "ANALYZING", "ANALYZED"])
            ).count(),
            "total_incidents": db.query(Incident).count(),
            "infrastructure_assets": db.query(InfrastructureAsset).count(),
            "active_work_orders": db.query(WorkOrder).filter(
                WorkOrder.status.in_(["CREATED", "ASSIGNED", "IN_PROGRESS"])
            ).count(),
        }
    finally:
        db.close()
