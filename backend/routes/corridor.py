"""Ambulance corridor request and management routes."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user, require_admin
from auth.models import User
from database.db import get_db
from database.models import Corridor
from schemas.corridor import CorridorRequest, CorridorResponse
from services.corridor import alert_police_for_corridor, optimize_corridor_route


router = APIRouter()


def _corridor_to_response(corridor: Corridor) -> CorridorResponse:
    return CorridorResponse(
        id=str(corridor.id),
        requested_by=str(corridor.requested_by) if corridor.requested_by else None,
        ambulance_id=corridor.ambulance_id,
        hospital_name=corridor.hospital_name,
        start_point=corridor.start_point,
        end_point=corridor.end_point,
        optimized_path=corridor.optimized_path,
        traffic_signals=corridor.traffic_signals,
        police_contacts_alerted=corridor.police_contacts_alerted,
        estimated_time_minutes=corridor.estimated_time_minutes,
        status=corridor.status,
        admin_approved=corridor.admin_approved,
        approved_by=str(corridor.approved_by) if corridor.approved_by else None,
        created_at=corridor.created_at,
    )


@router.post("/request", response_model=CorridorResponse)
async def request_corridor(
    payload: CorridorRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Request a corridor plan and create the initial corridor record."""

    plan = optimize_corridor_route(payload.start_point, payload.end_point, payload.urgency_level, payload.hospital_name)
    corridor = Corridor(
        requested_by=current_user.id,
        ambulance_id=payload.ambulance_id,
        hospital_name=payload.hospital_name,
        start_point=payload.start_point,
        end_point=payload.end_point,
        optimized_path=plan.get("optimized_route") or plan,
        traffic_signals=plan.get("traffic_signals", []),
        police_contacts_alerted={},
        estimated_time_minutes=float(plan.get("estimated_time_minutes", 0) or 0),
        status="active" if current_user.role == "admin" else "pending",
        admin_approved=current_user.role == "admin",
        approved_by=current_user.id if current_user.role == "admin" else None,
    )
    db.add(corridor)
    await db.flush()

    if corridor.status == "active":
        corridor.police_contacts_alerted = await alert_police_for_corridor(plan)

    await db.commit()
    await db.refresh(corridor)
    return _corridor_to_response(corridor)


@router.post("/{corridor_id}/approve", response_model=CorridorResponse)
async def approve_corridor(
    corridor_id: str,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve a pending corridor and trigger police alerts if needed."""

    result = await db.execute(select(Corridor).where(Corridor.id == corridor_id))
    corridor = result.scalar_one_or_none()
    if not corridor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Corridor not found")

    corridor.status = "active"
    corridor.admin_approved = True
    if not corridor.police_contacts_alerted:
        plan = {
            "voice_script_for_police": (
                "Officer, an ambulance is on the route. Please clear the lane and keep junctions open."
            )
        }
        corridor.police_contacts_alerted = await alert_police_for_corridor(plan)

    await db.commit()
    await db.refresh(corridor)
    return _corridor_to_response(corridor)


@router.get("/active", response_model=list[CorridorResponse])
async def active_corridors(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return all active corridors."""

    result = await db.execute(select(Corridor).where(Corridor.status == "active").order_by(Corridor.created_at.desc()))
    corridors = result.scalars().all()
    return [_corridor_to_response(corridor) for corridor in corridors]


@router.get("/{corridor_id}", response_model=CorridorResponse)
async def get_corridor(corridor_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return a single corridor record."""

    result = await db.execute(select(Corridor).where(Corridor.id == corridor_id))
    corridor = result.scalar_one_or_none()
    if not corridor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Corridor not found")
    if current_user.role != "admin" and corridor.requested_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return _corridor_to_response(corridor)
