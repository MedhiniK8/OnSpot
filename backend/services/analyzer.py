"""Groq-powered vision analysis for accident classification and response planning."""

from __future__ import annotations

import base64
import json
import logging
from pathlib import Path

from groq import Groq

from config import GROQ_API_KEY


logger = logging.getLogger(__name__)


def _read_image_base64(image_path: str) -> str:
    return base64.b64encode(Path(image_path).read_bytes()).decode("utf-8")


def _default_analysis(cnn_result: dict, location: str | None) -> dict:
    objects = cnn_result.get("objects", [])
    accident_type = "collision"
    if any(item == "person" for item in objects):
        accident_type = "medical"
    if any(item == "truck" for item in objects):
        accident_type = "collision"

    severity = "High" if cnn_result.get("confidence", 0) >= 0.75 else "Medium"
    departments = ["police", "hospital"] if severity == "High" else ["police"]
    if accident_type == "medical":
        departments = ["hospital", "police"]

    location_text = location or "the reported location"
    voice_script = (
        f"This is an automated alert from OnSpot AI system. A {accident_type} incident has been detected at "
        f"{location_text}. Severity level is {severity}. Immediate response is required. Please dispatch the "
        f"appropriate teams and secure the area."
    )

    return {
        "severity": severity,
        "accident_type": accident_type,
        "departments_to_call": departments,
        "voice_script": voice_script,
        "confidence": float(cnn_result.get("confidence", 0.5)),
        "severity_confidence": 0.85,
        "reasoning": "Fallback heuristic analysis used because the LLM was unavailable.",
        "recommended_action": "Dispatch emergency response teams and monitor the scene.",
    }


def _json_prompt(location: str | None, cnn_result: dict) -> str:
    return (
        "You are an AI emergency response system for OnSpot. "
        f"Location: {location or 'unknown'}. "
        f"CNN result: {json.dumps(cnn_result, ensure_ascii=False)}. "
        "Return ONLY a JSON object with keys severity, accident_type, departments_to_call, voice_script, confidence, severity_confidence, reasoning, recommended_action. "
        "The voice_script must sound like a real emergency call and be 25-30 seconds long. "
        "Return ONLY a JSON object. No explanation. No markdown. No backticks."
    )


def _parse_analysis(text: str, fallback: dict) -> dict:
    try:
        parsed = json.loads(text)
        if not isinstance(parsed, dict):
            raise ValueError("LLM response was not a JSON object")
        required = {
            "severity",
            "accident_type",
            "departments_to_call",
            "voice_script",
            "confidence",
            "severity_confidence",
            "reasoning",
            "recommended_action",
        }
        missing = required - set(parsed)
        if missing:
            raise ValueError(f"Missing keys: {sorted(missing)}")
        return parsed
    except Exception:
        return fallback


def analyze_image_with_groq(image_path: str, cnn_result: dict, location: str | None = None) -> dict:
    """Send the image and CNN context to Groq and return a normalized JSON payload."""

    fallback = _default_analysis(cnn_result, location)
    if not GROQ_API_KEY:
        fallback["reasoning"] = "GROQ_API_KEY is missing, so fallback analysis was used."
        return fallback

    try:
        client = Groq(api_key=GROQ_API_KEY)
        encoded_image = _read_image_base64(image_path)
        system_prompt = (
            "You are an AI emergency response system for OnSpot. "
            "You analyze traffic accident and emergency images in real time. "
            "Return ONLY valid JSON, no markdown, no explanation, no extra text."
        )
        user_prompt = _json_prompt(location, cnn_result)
        response = client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}},
                    ],
                },
            ],
            temperature=0.2,
        )
        content = response.choices[0].message.content or "{}"
        parsed = _parse_analysis(content, {})
        if parsed:
            return parsed

        retry_response = client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[
                {"role": "system", "content": system_prompt + " JSON only."},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt + " Return ONLY a JSON object. No explanation. No markdown. No backticks."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}},
                    ],
                },
            ],
            temperature=0.0,
        )
        retry_content = retry_response.choices[0].message.content or "{}"
        return _parse_analysis(retry_content, fallback)
    except Exception as exc:
        logger.exception("Groq analysis failed: %s", exc)
        fallback["error"] = "Groq analysis failed"
        fallback["reasoning"] = str(exc)
        return fallback
