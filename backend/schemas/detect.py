"""Schemas used by the accident detection pipeline."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class DetectedBox(BaseModel):
    label: str
    confidence: float
    box: list[float]


class CNNDetectionResult(BaseModel):
    detected: bool
    confidence: float = Field(ge=0.0, le=1.0)
    objects: list[str]
    raw_boxes: list[DetectedBox]
    note: str | None = None


class AIAnalysisResult(BaseModel):
    severity: str
    accident_type: str
    departments_to_call: list[str]
    voice_script: str
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    recommended_action: str
    error: str | None = None


class DetectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: str
    severity: str
    accident_type: str
    departments_alerted: list[str]
    call_status: dict[str, str]
    voice_script: str
    response_time_ms: int
    ai_reasoning: str
    status: str
