import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.pin import PinCreate, PinRead, PinUpdate
from app.services import pins as pin_svc
from app.services import trips as trip_svc

router = APIRouter(prefix="/trips/{trip_id}/pins", tags=["pins"])


async def _get_owned_trip(trip_id: uuid.UUID, db: AsyncSession, user: User):
    trip = await trip_svc.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("", response_model=PinRead, status_code=status.HTTP_201_CREATED)
async def create_pin(
    trip_id: uuid.UUID,
    data: PinCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_owned_trip(trip_id, db, user)
    return await pin_svc.create_pin(db, trip_id, data)


@router.get("", response_model=list[PinRead])
async def list_pins(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_owned_trip(trip_id, db, user)
    return await pin_svc.list_pins(db, trip_id)


@router.get("/{pin_id}", response_model=PinRead)
async def get_pin(
    trip_id: uuid.UUID,
    pin_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_owned_trip(trip_id, db, user)
    pin = await pin_svc.get_pin(db, pin_id, trip_id)
    if not pin:
        raise HTTPException(status_code=404, detail="Pin not found")
    return pin


@router.patch("/{pin_id}", response_model=PinRead)
async def update_pin(
    trip_id: uuid.UUID,
    pin_id: uuid.UUID,
    data: PinUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_owned_trip(trip_id, db, user)
    pin = await pin_svc.get_pin(db, pin_id, trip_id)
    if not pin:
        raise HTTPException(status_code=404, detail="Pin not found")
    return await pin_svc.update_pin(db, pin, data)


@router.delete("/{pin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pin(
    trip_id: uuid.UUID,
    pin_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_owned_trip(trip_id, db, user)
    pin = await pin_svc.get_pin(db, pin_id, trip_id)
    if not pin:
        raise HTTPException(status_code=404, detail="Pin not found")
    await pin_svc.delete_pin(db, pin)
