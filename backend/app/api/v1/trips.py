import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.trip import TripCreate, TripRead, TripUpdate
from app.services import trips as trip_svc

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("", response_model=TripRead, status_code=status.HTTP_201_CREATED)
async def create_trip(
    data: TripCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await trip_svc.create_trip(db, user.id, data)


@router.get("", response_model=list[TripRead])
async def list_trips(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await trip_svc.list_trips(db, user.id)


@router.get("/{trip_id}", response_model=TripRead)
async def get_trip(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await trip_svc.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.patch("/{trip_id}", response_model=TripRead)
async def update_trip(
    trip_id: uuid.UUID,
    data: TripUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await trip_svc.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return await trip_svc.update_trip(db, trip, data)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await trip_svc.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    await trip_svc.delete_trip(db, trip)
