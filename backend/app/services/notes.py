from __future__ import annotations

import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate


async def create_note(db: AsyncSession, trip_id: uuid.UUID, data: NoteCreate) -> Note:
    note = Note(trip_id=trip_id, **data.model_dump())
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return note


async def get_note(db: AsyncSession, note_id: uuid.UUID, trip_id: uuid.UUID) -> Note | None:
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.trip_id == trip_id)
    )
    return result.scalar_one_or_none()


async def list_notes(db: AsyncSession, trip_id: uuid.UUID) -> list[Note]:
    result = await db.execute(
        select(Note).where(Note.trip_id == trip_id).order_by(Note.updated_at.desc())
    )
    return list(result.scalars().all())


async def update_note(db: AsyncSession, note: Note, data: NoteUpdate) -> Note:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    await db.flush()
    await db.refresh(note)
    return note


async def delete_note(db: AsyncSession, note: Note) -> None:
    await db.delete(note)
