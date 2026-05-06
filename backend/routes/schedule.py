"""Scheduling endpoint for planned VIP and corridor events."""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from auth.models import User
from database.db import get_db
from database.models import Event


router = APIRouter()


class ScheduleRequest(BaseModel):
    title: str
    location: str | None = None
    event_type: str
    scheduled_at: str
    notes: str | None = None


@router.post("")
async def schedule_event(
    payload: ScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Store a scheduled event request in the event log for dashboard visibility."""

    try:
        try:
            datetime.fromisoformat(payload.scheduled_at.replace("Z", "+00:00"))
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="scheduled_at must be a valid ISO datetime") from exc

        event = Event(
            id=uuid.uuid4(),
            user_id=current_user.id,
            input_type="text",
            image_path=None,
            location=payload.location,
            severity="Low",
            accident_type="unknown",
            departments_alerted=["police"] if payload.event_type.lower() == "vip" else ["hospital", "police"],
            voice_script=(
                "Scheduled event created: "
                f"{payload.title}. "
                f"Type: {payload.event_type}. "
                f"Time: {payload.scheduled_at}."
            ),
            call_status={},
            ai_decision=(
                "Scheduled event request stored. "
                f"event_type={payload.event_type}; scheduled_at={payload.scheduled_at}; notes={payload.notes or ''}"
            ),
            status="ongoing",
            response_time_ms=0,
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)

        return {
            "schedule_id": str(event.id),
            "status": "scheduled",
            "title": payload.title,
            "event_type": payload.event_type,
            "location": payload.location,
            "scheduled_at": payload.scheduled_at,
        }
    except HTTPException:
        raise
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to schedule event") from exc
