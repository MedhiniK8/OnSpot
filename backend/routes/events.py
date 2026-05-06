"""Event history, detail, and feedback endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from auth.models import User
from database.db import get_db
from database.models import AdaptationLog, Event
from schemas.events import EventFeedbackUpdate, EventListResponse, EventRead


router = APIRouter()


def _event_to_read(event: Event) -> EventRead:
    return EventRead(
        id=str(event.id),
        user_id=str(event.user_id) if event.user_id else None,
        input_type=event.input_type,
        image_path=event.image_path,
        location=event.location,
        severity=event.severity,
        accident_type=event.accident_type,
        departments_alerted=event.departments_alerted or [],
        voice_script=event.voice_script,
        audio_file_path=event.audio_file_path,
        call_status=event.call_status or {},
        ai_decision=event.ai_decision,
        status=event.status,
        response_time_ms=event.response_time_ms,
        training_metadata=event.training_metadata,
        created_at=event.created_at,
    )


@router.get("", response_model=EventListResponse)
async def list_events(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    type: str | None = Query(default=None, alias="type"),
    severity: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return paginated events for the current user or all events for admins."""

    statement = select(Event)
    count_statement = select(func.count()).select_from(Event)

    if current_user.role != "admin":
        statement = statement.where(Event.user_id == current_user.id)
        count_statement = count_statement.where(Event.user_id == current_user.id)
    if type:
        statement = statement.where(Event.input_type == type)
        count_statement = count_statement.where(Event.input_type == type)
    if severity:
        statement = statement.where(Event.severity == severity)
        count_statement = count_statement.where(Event.severity == severity)
    if status_filter:
        statement = statement.where(Event.status == status_filter)
        count_statement = count_statement.where(Event.status == status_filter)

    statement = statement.order_by(Event.created_at.desc()).offset((page - 1) * limit).limit(limit)
    rows = await db.execute(statement)
    total = await db.scalar(count_statement)
    events = rows.scalars().all()

    return EventListResponse(items=[_event_to_read(event) for event in events], page=page, limit=limit, total=int(total or 0))


@router.get("/{event_id}", response_model=EventRead)
async def get_event(event_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return a full event record if the user is allowed to view it."""

    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if current_user.role != "admin" and event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this event")
    return _event_to_read(event)


@router.patch("/{event_id}/feedback")
async def update_feedback(
    event_id: str,
    payload: EventFeedbackUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the adaptation log feedback for the specified event."""

    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if current_user.role != "admin" and event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    log_result = await db.execute(select(AdaptationLog).where(AdaptationLog.event_id == event.id).order_by(AdaptationLog.created_at.desc()))
    adaptation_log = log_result.scalar_one_or_none()
    if adaptation_log is None:
        adaptation_log = AdaptationLog(
            event_id=event.id,
            severity_predicted=event.severity,
            departments_called=event.departments_alerted or [],
            response_time_ms=event.response_time_ms or 0,
            outcome_feedback=payload.outcome_feedback,
            rule_version=1,
        )
        db.add(adaptation_log)
    else:
        adaptation_log.outcome_feedback = payload.outcome_feedback

    await db.commit()
    return {"message": "Feedback updated", "event_id": event_id, "outcome_feedback": payload.outcome_feedback}
