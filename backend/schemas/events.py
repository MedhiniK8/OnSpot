"""Schemas for event history and feedback routes."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EventFeedbackUpdate(BaseModel):
    outcome_feedback: str = Field(pattern="^(accurate|over_alert|under_alert)$")


class AdminOverrideRequest(BaseModel):
    action: str = Field(pattern="^(escalate|dismiss)$")
    note: str | None = None


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str | None = None
    input_type: str
    image_path: str | None = None
    location: str | None = None
    severity: str
    accident_type: str
    departments_alerted: list[str]
    voice_script: str | None = None
    audio_file_path: str | None = None
    call_status: dict[str, str]
    ai_decision: str | None = None
    status: str
    response_time_ms: int | None = None
    training_metadata: dict | None = None
    created_at: datetime | None = None


class EventListResponse(BaseModel):
    items: list[EventRead]
    page: int
    limit: int
    total: int
