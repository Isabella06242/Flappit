from __future__ import annotations

import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.trip import Trip
from app.schemas.trip import TripCreate, TripUpdate


async def create_trip(db: AsyncSession, owner_id: uuid.UUID, data: TripCreate) -> Trip:
    trip = Trip(owner_id=owner_id, **data.model_dump())
    db.add(trip)
    await db.flush()
    await db.refresh(trip)
    return trip


async def get_trip(db: AsyncSession, trip_id: uuid.UUID, owner_id: uuid.UUID) -> Trip | None:
    result = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.owner_id == owner_id)
    )
    return result.scalar_one_or_none()


async def list_trips(db: AsyncSession, owner_id: uuid.UUID) -> list[Trip]:
    result = await db.execute(
        select(Trip).where(Trip.owner_id == owner_id).order_by(Trip.updated_at.desc())
    )
    return list(result.scalars().all())


async def update_trip(
    db: AsyncSession, trip: Trip, data: TripUpdate
) -> Trip:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)
    await db.flush()
    await db.refresh(trip)
    return trip


async def delete_trip(db: AsyncSession, trip: Trip) -> None:
    await db.delete(trip)
