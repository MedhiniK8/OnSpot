"""Schemas for ambulance corridor requests and responses."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CorridorRequest(BaseModel):
    hospital_name: str
    start_point: str
    end_point: str
    ambulance_id: str
    urgency_level: str = Field(default="medium")


class CorridorApproveRequest(BaseModel):
    force_alert: bool = True


class CorridorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    requested_by: str | None = None
    ambulance_id: str
    hospital_name: str
    start_point: str
    end_point: str
    optimized_path: dict | list | None = None
    traffic_signals: list | dict | None = None
    police_contacts_alerted: dict | list | None = None
    estimated_time_minutes: float | None = None
    status: str
    admin_approved: bool
    approved_by: str | None = None
    created_at: datetime | None = None
