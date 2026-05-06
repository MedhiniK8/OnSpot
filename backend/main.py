"""FastAPI application entrypoint for OnSpot."""

from __future__ import annotations

import json
import logging
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select

from config import AUDIO_DIR, ensure_runtime_directories
from database.db import Base, async_session_maker, engine
from database.models import AdminRule, AdaptationLog, Corridor, Event, User
from auth.router import router as auth_router
from routes.admin import router as admin_router
from routes.analyze import router as analyze_router
from routes.corridor import router as corridor_router
from routes.detect import router as detect_router
from routes.events import router as events_router
from routes.insights import router as insights_router
from routes.schedule import router as schedule_router


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="OnSpot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/audio/{filename}")
async def serve_audio(filename: str):
    """Serve generated MP3 files so Twilio can fetch them."""

    file_path = AUDIO_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(file_path, media_type="audio/mpeg", filename=filename)


app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(analyze_router, prefix="/analyze", tags=["analyze"])
app.include_router(schedule_router, prefix="/schedule", tags=["schedule"])
app.include_router(detect_router, prefix="/detect", tags=["detect"])
app.include_router(events_router, prefix="/events", tags=["events"])
app.include_router(corridor_router, prefix="/corridor", tags=["corridor"])
app.include_router(insights_router, prefix="/insights", tags=["insights"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])


async def seed_demo_data() -> None:
    """Populate the database with a small demo dataset for hackathon judging."""

    async with async_session_maker() as session:
        existing_rules = await session.scalar(select(func.count()).select_from(AdminRule))
        if not existing_rules:
            demo_rules = [
                AdminRule(rule_name="High severity escalation", condition="severity == HIGH", action="alert police + ambulance", is_active=True),
                AdminRule(rule_name="Fire priority", condition="accident_type == fire", action="alert fire + police", is_active=True),
            ]
            session.add_all(demo_rules)

        existing_events = await session.scalar(select(func.count()).select_from(Event))
        if not existing_events:
            demo_user = User(
                email="demo@onspot.com",
                full_name="OnSpot Demo User",
                hashed_password="$2b$12$onspotdemohashedpassword",
                role="admin",
                is_active=True,
            )
            session.add(demo_user)
            await session.flush()

            demo_events = [
                Event(user_id=demo_user.id, input_type="image", severity="High", accident_type="collision", departments_alerted=["police", "hospital"], voice_script="Demo call 1", call_status={"police": "initiated"}, ai_decision="Demo collision detected", status="completed", response_time_ms=5200),
                Event(user_id=demo_user.id, input_type="image", severity="Medium", accident_type="medical", departments_alerted=["hospital", "police"], voice_script="Demo call 2", call_status={"hospital": "initiated"}, ai_decision="Demo medical response", status="completed", response_time_ms=4100),
                Event(user_id=demo_user.id, input_type="image", severity="Low", accident_type="unknown", departments_alerted=["police"], voice_script="Demo call 3", call_status={"police": "initiated"}, ai_decision="Demo low severity event", status="completed", response_time_ms=3800),
            ]
            session.add_all(demo_events)
            await session.flush()

            logs = [
                AdaptationLog(event_id=demo_events[0].id, severity_predicted="High", departments_called=["police", "hospital"], response_time_ms=5200, outcome_feedback="accurate", rule_version=1),
                AdaptationLog(event_id=demo_events[1].id, severity_predicted="Medium", departments_called=["hospital", "police"], response_time_ms=4100, outcome_feedback="accurate", rule_version=2),
                AdaptationLog(event_id=demo_events[2].id, severity_predicted="Low", departments_called=["police"], response_time_ms=3800, outcome_feedback="over_alert", rule_version=2),
                AdaptationLog(event_id=demo_events[0].id, severity_predicted="High", departments_called=["police", "hospital"], response_time_ms=3600, outcome_feedback="accurate", rule_version=3),
                AdaptationLog(event_id=demo_events[1].id, severity_predicted="Medium", departments_called=["hospital", "police"], response_time_ms=3400, outcome_feedback="accurate", rule_version=3),
                AdaptationLog(event_id=demo_events[2].id, severity_predicted="Low", departments_called=["police"], response_time_ms=3300, outcome_feedback="under_alert", rule_version=3),
            ]
            session.add_all(logs)

        await session.commit()


@app.on_event("startup")
async def on_startup() -> None:
    """Create runtime directories, database tables, and demo seed data."""

    ensure_runtime_directories()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_demo_data()


@app.get("/")
async def root() -> dict[str, str]:
    return {"status": "OnSpot API running", "version": "1.0.0"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}
