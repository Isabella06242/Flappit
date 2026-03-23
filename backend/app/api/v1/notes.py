import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate
from app.services import notes as note_svc
from app.services import trips as trip_svc

router = APIRouter(prefix="/trips/{trip_id}/notes", tags=["notes"])


async def _get_owned_trip(trip_id: uuid.UUID, db: AsyncSession, user: User):
    trip = await trip_svc.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def create_note(
    trip_id: uuid.UUID,
    data: NoteCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_owned_trip(trip_id, db, user)
    return await note_svc.create_note(db, trip_id, data)


@router.get("", response_model=list[NoteRead])
async def list_notes(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_owned_trip(trip_id, db, user)
    return await note_svc.list_notes(db, trip_id)


@router.get("/{note_id}", response_model=NoteRead)
async def get_note(
    trip_id: uuid.UUID,
    note_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_owned_trip(trip_id, db, user)
    note = await note_svc.get_note(db, note_id, trip_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.patch("/{note_id}", response_model=NoteRead)
async def update_note(
    trip_id: uuid.UUID,
    note_id: uuid.UUID,
    data: NoteUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_owned_trip(trip_id, db, user)
    note = await note_svc.get_note(db, note_id, trip_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return await note_svc.update_note(db, note, data)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    trip_id: uuid.UUID,
    note_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_owned_trip(trip_id, db, user)
    note = await note_svc.get_note(db, note_id, trip_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    await note_svc.delete_note(db, note)
