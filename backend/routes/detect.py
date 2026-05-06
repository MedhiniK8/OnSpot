"""Accident detection endpoint and audio serving helper route."""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from auth.models import User
from config import AUDIO_DIR, UPLOAD_DIR
from database.db import get_db
from database.models import AdaptationLog, Event
from schemas.detect import DetectResponse
from services.analyzer import analyze_image_with_groq
from services.cnn import detect_accident_objects
from services.voice import generate_voice_audio, trigger_department_calls


logger = logging.getLogger(__name__)

router = APIRouter()


async def _save_upload_file(upload_file: UploadFile, destination: Path) -> None:
    content = await upload_file.read()
    await asyncio.to_thread(destination.write_bytes, content)


@router.post("", response_model=DetectResponse)
async def detect_accident(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Process an uploaded image and trigger the emergency response pipeline."""

    start_time = time.time()
    event_id = str(uuid.uuid4())
    uploaded_path = UPLOAD_DIR / f"{event_id}_{file.filename or 'upload.jpg'}"

    try:
        await _save_upload_file(file, uploaded_path)
        cnn_result = await asyncio.to_thread(detect_accident_objects, str(uploaded_path))
        analysis = await asyncio.to_thread(
            analyze_image_with_groq,
            str(uploaded_path),
            cnn_result,
            None,
        )

        if analysis.get("error"):
            response_time_ms = int((time.time() - start_time) * 1000)
            return DetectResponse(
                event_id=event_id,
                severity=analysis.get("severity", "High"),
                accident_type=analysis.get("accident_type", "unknown"),
                departments_alerted=analysis.get("departments_to_call", []),
                call_status={},
                voice_script=analysis.get("voice_script", ""),
                response_time_ms=response_time_ms,
                ai_reasoning=analysis.get("reasoning", "Groq analysis failed"),
                status="failed",
            )

        departments_to_call = list(dict.fromkeys(analysis.get("departments_to_call", [])))
        voice_script = analysis.get("voice_script", "")
        audio_file_path, audio_error = await generate_voice_audio(voice_script, event_id)

        call_status: dict[str, str] = {}
        if analysis.get("severity") in {"Medium", "High"} and departments_to_call:
            call_status = await trigger_department_calls(departments_to_call, voice_script, audio_file_path)

        response_time_ms = int((time.time() - start_time) * 1000)
        event = Event(
            id=uuid.UUID(event_id),
            user_id=current_user.id,
            input_type="image",
            image_path=str(uploaded_path),
            location=None,
            severity=analysis.get("severity", "High"),
            accident_type=analysis.get("accident_type", "unknown"),
            departments_alerted=departments_to_call,
            voice_script=voice_script,
            audio_file_path=audio_file_path,
            call_status=call_status,
            ai_decision=analysis.get("reasoning", ""),
            status="completed",
            response_time_ms=response_time_ms,
        )
        db.add(event)
        await db.flush()

        adaptation_log = AdaptationLog(
            event_id=event.id,
            severity_predicted=analysis.get("severity", "High"),
            departments_called=departments_to_call,
            response_time_ms=response_time_ms,
            rule_version=1,
        )
        db.add(adaptation_log)
        await db.commit()

        if audio_error:
            logger.info("Audio generation fallback used: %s", audio_error)

        return DetectResponse(
            event_id=str(event.id),
            severity=analysis.get("severity", "High"),
            accident_type=analysis.get("accident_type", "unknown"),
            departments_alerted=departments_to_call,
            call_status=call_status,
            voice_script=voice_script,
            response_time_ms=response_time_ms,
            ai_reasoning=analysis.get("reasoning", ""),
            status="completed",
        )
    except Exception as exc:
        logger.exception("Detection pipeline failed: %s", exc)
        try:
            await db.rollback()
        except Exception:
            pass
        response_time_ms = int((time.time() - start_time) * 1000)
        return DetectResponse(
            event_id=event_id,
            severity="High",
            accident_type="unknown",
            departments_alerted=[],
            call_status={},
            voice_script="",
            response_time_ms=response_time_ms,
            ai_reasoning="Detection pipeline failed",
            status="failed",
        )

