from __future__ import annotations

import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pin import Pin
from app.schemas.pin import PinCreate, PinUpdate


async def create_pin(db: AsyncSession, trip_id: uuid.UUID, data: PinCreate) -> Pin:
    pin = Pin(trip_id=trip_id, **data.model_dump())
    db.add(pin)
    await db.flush()
    await db.refresh(pin)
    return pin


async def get_pin(db: AsyncSession, pin_id: uuid.UUID, trip_id: uuid.UUID) -> Pin | None:
    result = await db.execute(
        select(Pin).where(Pin.id == pin_id, Pin.trip_id == trip_id)
    )
    return result.scalar_one_or_none()


async def list_pins(db: AsyncSession, trip_id: uuid.UUID) -> list[Pin]:
    result = await db.execute(
        select(Pin).where(Pin.trip_id == trip_id).order_by(Pin.created_at.asc())
    )
    return list(result.scalars().all())


async def update_pin(db: AsyncSession, pin: Pin, data: PinUpdate) -> Pin:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pin, field, value)
    await db.flush()
    await db.refresh(pin)
    return pin


async def delete_pin(db: AsyncSession, pin: Pin) -> None:
    await db.delete(pin)
