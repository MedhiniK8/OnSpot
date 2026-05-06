"""Admin-only routes for overrides, rules, and user management."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import require_admin
from auth.models import User
from database.db import get_db
from database.models import AdminRule, Corridor, Event, EventOverride, User as DBUser
from routes.events import _event_to_read


router = APIRouter()


class OverrideRequest(BaseModel):
    action: str
    note: str | None = None


class RuleCreateRequest(BaseModel):
    rule_name: str
    condition: str
    action: str


class RuleUpdateRequest(BaseModel):
    rule_name: str | None = None
    condition: str | None = None
    action: str | None = None
    is_active: bool | None = None


class RoleUpdateRequest(BaseModel):
    role: str


@router.get("/events")
async def admin_events(_: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Return all events with full details."""

    result = await db.execute(select(Event).order_by(Event.created_at.desc()))
    return {"items": [_event_to_read(event).model_dump() for event in result.scalars().all()]}


@router.post("/events/{event_id}/override")
async def override_event(
    event_id: str,
    payload: OverrideRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Log an administrative override for an event."""

    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    override = EventOverride(event_id=event.id, action=payload.action, note=payload.note, created_by=admin_user.id)
    db.add(override)
    if payload.action == "escalate":
        event.status = "ongoing"
    else:
        event.status = "completed"
    event.ai_decision = (event.ai_decision or "") + f"\nAdmin override by {admin_user.email} at {datetime.utcnow().isoformat()}: {payload.action}"
    await db.commit()
    return {"message": "Override logged", "event_id": event_id, "action": payload.action}


@router.get("/rules")
async def list_rules(_: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Return all dynamic rules."""

    result = await db.execute(select(AdminRule).order_by(AdminRule.created_at.desc()))
    rules = result.scalars().all()
    return {
        "items": [
            {
                "id": str(rule.id),
                "rule_name": rule.rule_name,
                "condition": rule.condition,
                "action": rule.action,
                "is_active": rule.is_active,
                "created_by": str(rule.created_by) if rule.created_by else None,
                "created_at": rule.created_at,
                "updated_at": rule.updated_at,
            }
            for rule in rules
        ]
    }


@router.post("/rules")
async def create_rule(
    payload: RuleCreateRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a live rule that can be used for dynamic adaptation."""

    rule = AdminRule(
        rule_name=payload.rule_name,
        condition=payload.condition,
        action=payload.action,
        is_active=True,
        created_by=admin_user.id,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return {"id": str(rule.id), "rule_name": rule.rule_name, "condition": rule.condition, "action": rule.action, "is_active": rule.is_active}


@router.patch("/rules/{rule_id}")
async def update_rule(
    rule_id: str,
    payload: RuleUpdateRequest,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a rule in place to simulate live injection without restart."""

    result = await db.execute(select(AdminRule).where(AdminRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")

    if payload.rule_name is not None:
        rule.rule_name = payload.rule_name
    if payload.condition is not None:
        rule.condition = payload.condition
    if payload.action is not None:
        rule.action = payload.action
    if payload.is_active is not None:
        rule.is_active = payload.is_active

    await db.commit()
    return {"message": "Rule updated", "id": rule_id}


@router.get("/users")
async def admin_users(_: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Return all registered users."""

    result = await db.execute(select(DBUser).order_by(DBUser.created_at.desc()))
    users = result.scalars().all()
    return {
        "items": [
            {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at,
            }
            for user in users
        ]
    }


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    payload: RoleUpdateRequest,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Promote or demote a user."""

    if payload.role not in {"user", "admin"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

    result = await db.execute(select(DBUser).where(DBUser.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = payload.role
    await db.commit()
    return {"message": "User role updated", "id": user_id, "role": payload.role}
