"""Audio generation and emergency call dispatch helpers."""

from __future__ import annotations

import asyncio
import logging
import os
from html import escape
from pathlib import Path

import httpx
from twilio.rest import Client

from config import (
    AUDIO_DIR,
    BASE_URL,
    ELEVENLABS_API_KEY,
    ELEVENLABS_VOICE_ID,
    FIRE_NUMBER,
    HOSPITAL_NUMBER,
    POLICE_NUMBER,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
)


logger = logging.getLogger(__name__)


def _number_for_department(department: str) -> str | None:
    mapping = {
        "police":   POLICE_NUMBER,
        "hospital": HOSPITAL_NUMBER,
        "fire":     FIRE_NUMBER,
    }
    return mapping.get(department.lower())


def _build_twiml(audio_url: str | None, voice_script: str) -> str:
    """
    Build TwiML for Twilio calls.

    Priority:
      1. Play ElevenLabs-generated audio (if URL is available)
      2. Fall back to Twilio's built-in <Say> TTS — always works
    """
    if audio_url:
        safe_script = escape(voice_script)
        safe_url    = escape(audio_url)
        # Try to play the audio; if Twilio cannot fetch it, fall back to <Say>
        return (
            f"<Response>"
            f"<Play>{safe_url}</Play>"
            f"<Say voice='alice'>{safe_script}</Say>"
            f"</Response>"
        )
    safe_script = escape(voice_script)
    return f"<Response><Say voice='alice'>{safe_script}</Say></Response>"


async def generate_voice_audio(voice_script: str, event_id: str) -> tuple[str | None, str | None]:
    """Generate an MP3 file through ElevenLabs, falling back cleanly on failure."""

    if not ELEVENLABS_API_KEY:
        logger.warning("ELEVENLABS_API_KEY not configured — voice audio skipped")
        return None, "ELEVENLABS_API_KEY not configured"

    audio_path = AUDIO_DIR / f"event_{event_id}.mp3"
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "accept": "audio/mpeg",
    }
    payload = {
        "text": voice_script,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {"stability": 0.45, "similarity_boost": 0.85},
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
        audio_path.write_bytes(response.content)
        logger.info("ElevenLabs audio generated: %s", audio_path.name)
        return str(audio_path), None
    except Exception as exc:
        logger.exception("ElevenLabs synthesis failed — will use Twilio <Say> fallback: %s", exc)
        return None, str(exc)


async def trigger_department_calls(
    departments: list[str],
    voice_script: str,
    audio_file_path: str | None = None,
) -> dict[str, str]:
    """Place Twilio calls for each emergency department and return a status map."""

    # Validate Twilio credentials before attempting calls
    if not TWILIO_ACCOUNT_SID:
        logger.error("TWILIO_ACCOUNT_SID is not set — cannot place calls")
        return {dept: "twilio_not_configured" for dept in departments}
    if not TWILIO_AUTH_TOKEN:
        logger.error("TWILIO_AUTH_TOKEN is not set — cannot place calls")
        return {dept: "twilio_not_configured" for dept in departments}
    if not TWILIO_PHONE_NUMBER:
        logger.error("TWILIO_PHONE_NUMBER is not set — cannot place calls")
        return {dept: "twilio_not_configured" for dept in departments}

    # Build audio URL only if a file was actually written
    audio_url: str | None = None
    if audio_file_path and Path(audio_file_path).exists():
        filename  = Path(audio_file_path).name
        audio_url = f"{BASE_URL}/audio/{filename}"
        logger.info("Audio URL for Twilio: %s", audio_url)
    else:
        logger.warning("No audio file available — Twilio will use <Say> TTS fallback")

    twiml = _build_twiml(audio_url, voice_script)

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except Exception as exc:
        logger.exception("Failed to instantiate Twilio client: %s", exc)
        return {dept: f"twilio_client_error: {exc}" for dept in departments}

    call_status: dict[str, str] = {}

    for department in departments:
        phone_number = _number_for_department(department)
        if not phone_number:
            logger.warning("No phone number configured for department: %s", department)
            call_status[department] = "missing_number"
            continue

        logger.info(
            "Placing Twilio call | dept=%s | to=%s | from=%s",
            department, phone_number, TWILIO_PHONE_NUMBER,
        )

        def _create_call(to: str = phone_number, twiml_str: str = twiml) -> str:
            call = client.calls.create(
                to=to,
                from_=TWILIO_PHONE_NUMBER,
                twiml=twiml_str,
            )
            return call.sid

        try:
            call_sid = await asyncio.to_thread(_create_call)
            logger.info("Twilio call placed for %s — SID: %s", department, call_sid)
            call_status[department] = call_sid
        except Exception as exc:
            logger.exception("Twilio call FAILED for %s: %s", department, exc)
            call_status[department] = f"failed: {exc}"

    return call_status
