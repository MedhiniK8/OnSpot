"""Learning and system insight endpoints."""

from __future__ import annotations

from collections import Counter, defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from auth.models import User
from database.db import get_db
from database.models import AdaptationLog, Event


router = APIRouter()


@router.get("")
async def insights(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Aggregate learning metrics for the frontend system-learning card."""

    events_result = await db.execute(select(Event))
    logs_result = await db.execute(select(AdaptationLog))
    events = events_result.scalars().all()
    logs = logs_result.scalars().all()

    total_events = len(events)
    avg_response_time_ms = int(sum(log.response_time_ms for log in logs) / len(logs)) if logs else 0
    accuracy_rate = round(sum(1 for log in logs if log.outcome_feedback == "accurate") / len(logs), 2) if logs else 0.0

    accident_counter = Counter(event.accident_type for event in events)
    most_common_accident_type = accident_counter.most_common(1)[0][0] if accident_counter else "unknown"

    department_counter = Counter()
    severity_counter = Counter()
    weekly_times = defaultdict(list)

    for event in events:
        severity_counter[event.severity] += 1
        department_counter.update(event.departments_alerted or [])

    for log in logs:
        week_number = ((log.created_at.isocalendar().week - 1) % 3) + 1 if log.created_at else 1
        weekly_times[f"Week {week_number}"].append(log.response_time_ms)

    adaptation_improvement = [
        {"week": week, "avg_response_ms": int(sum(values) / len(values)) if values else 0}
        for week, values in sorted(weekly_times.items())
    ]

    return {
        "total_events": total_events,
        "avg_response_time_ms": avg_response_time_ms,
        "accuracy_rate": accuracy_rate,
        "most_common_accident_type": most_common_accident_type,
        "departments_alert_frequency": dict(department_counter),
        "severity_distribution": dict(severity_counter),
        "adaptation_improvement": adaptation_improvement,
        "rule_version": max((log.rule_version for log in logs), default=1),
    }
