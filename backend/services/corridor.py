"""Route optimization and police alert helpers for ambulance green corridors."""

from __future__ import annotations

import json
import logging

from groq import Groq

from config import GROQ_API_KEY
from services.voice import trigger_department_calls


logger = logging.getLogger(__name__)


def _default_corridor_plan(start_point: str, end_point: str, urgency_level: str) -> dict:
    estimated_time = 18.0 if urgency_level.lower() == "high" else 24.0
    return {
        "optimized_route": [start_point, "Primary Junction", "Bypass Road", end_point],
        "total_distance_km": 5.5,
        "estimated_time_minutes": estimated_time,
        "traffic_signals": [
            {
                "signal_id": "TS001",
                "location": "Primary Junction",
                "action": "turn_green",
                "sequence": 1,
            }
        ],
        "police_checkpoints": [
            {
                "checkpoint_id": "PC001",
                "location": "City Center",
                "officer_count_needed": 2,
            }
        ],
        "voice_script_for_police": (
            "Officer, an ambulance is approaching the green corridor route. Please secure the road, clear the junctions, "
            "and keep the route open until the ambulance passes."
        ),
    }


def _parse_plan(text: str, fallback: dict) -> dict:
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else fallback
    except Exception:
        return fallback


def optimize_corridor_route(start_point: str, end_point: str, urgency_level: str, hospital_name: str) -> dict:
    """Ask Groq for a corridor plan and fall back to a deterministic route if needed."""

    fallback = _default_corridor_plan(start_point, end_point, urgency_level)
    if not GROQ_API_KEY:
        return fallback

    try:
        client = Groq(api_key=GROQ_API_KEY)
        prompt = (
            "You are optimizing an ambulance green corridor for OnSpot. "
            f"Start: {start_point}. End: {end_point}. Hospital: {hospital_name}. Urgency: {urgency_level}. "
            "Return a JSON object with keys optimized_route, total_distance_km, estimated_time_minutes, traffic_signals, police_checkpoints, voice_script_for_police. "
            "Return ONLY a JSON object. No explanation. No markdown. No backticks."
        )
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an emergency traffic optimization assistant for OnSpot."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )
        content = response.choices[0].message.content or "{}"
        return _parse_plan(content, fallback)
    except Exception as exc:
        logger.exception("Corridor optimization failed: %s", exc)
        return fallback


async def alert_police_for_corridor(plan: dict) -> dict[str, str]:
    """Dispatch a corridor alert to police using the generated voice script."""

    police_script = plan.get("voice_script_for_police") or "An ambulance corridor has been activated."
    return await trigger_department_calls(["police"], police_script)
