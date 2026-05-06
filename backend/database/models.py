"""All SQLAlchemy models for the OnSpot backend."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.db import Base


def uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = uuid_pk()
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(Enum("user", "admin", name="user_roles"), default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    events: Mapped[list["Event"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    requested_corridors: Mapped[list["Corridor"]] = relationship(
        foreign_keys="Corridor.requested_by",
        back_populates="requester",
    )


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    input_type: Mapped[str] = mapped_column(Enum("image", "voice", "text", name="event_input_types"))
    image_path: Mapped[str | None] = mapped_column(String, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    severity: Mapped[str] = mapped_column(Enum("Low", "Medium", "High", name="event_severities"))
    accident_type: Mapped[str] = mapped_column(
        Enum("collision", "fire", "medical", "unknown", name="accident_types"),
        default="unknown",
    )
    departments_alerted: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    voice_script: Mapped[str | None] = mapped_column(Text, nullable=True)
    audio_file_path: Mapped[str | None] = mapped_column(String, nullable=True)
    call_status: Mapped[dict] = mapped_column(JSON, default=dict)
    ai_decision: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("ongoing", "completed", "failed", name="event_statuses"),
        default="ongoing",
    )
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    training_metadata: Mapped[dict | None] = mapped_column(JSON, default=dict, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    user: Mapped[User | None] = relationship(back_populates="events")
    adaptation_log: Mapped[list["AdaptationLog"]] = relationship(back_populates="event", cascade="all, delete-orphan")


class AdaptationLog(Base):
    __tablename__ = "adaptation_log"

    id: Mapped[uuid.UUID] = uuid_pk()
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), nullable=False)
    severity_predicted: Mapped[str] = mapped_column(String, nullable=False)
    departments_called: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    response_time_ms: Mapped[int] = mapped_column(Integer, default=0)
    outcome_feedback: Mapped[str | None] = mapped_column(
        Enum("accurate", "over_alert", "under_alert", name="feedback_outcomes"),
        nullable=True,
    )
    rule_version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    event: Mapped[Event] = relationship(back_populates="adaptation_log")


class Corridor(Base):
    __tablename__ = "corridors"

    id: Mapped[uuid.UUID] = uuid_pk()
    requested_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    ambulance_id: Mapped[str] = mapped_column(String, nullable=False)
    hospital_name: Mapped[str] = mapped_column(String, nullable=False)
    start_point: Mapped[str] = mapped_column(String, nullable=False)
    end_point: Mapped[str] = mapped_column(String, nullable=False)
    optimized_path: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    traffic_signals: Mapped[list | dict | None] = mapped_column(JSON, nullable=True)
    police_contacts_alerted: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    estimated_time_minutes: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("pending", "active", "completed", name="corridor_statuses"),
        default="pending",
    )
    admin_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    requester: Mapped[User | None] = relationship(foreign_keys=[requested_by], back_populates="requested_corridors")


class AdminRule(Base):
    __tablename__ = "admin_rules"

    id: Mapped[uuid.UUID] = uuid_pk()
    rule_name: Mapped[str] = mapped_column(String, nullable=False)
    condition: Mapped[str] = mapped_column(String, nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class EventOverride(Base):
    __tablename__ = "event_overrides"

    id: Mapped[uuid.UUID] = uuid_pk()
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
