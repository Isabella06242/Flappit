from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel


class NoteCreate(BaseModel):
    title: str = "Untitled note"
    content: dict = {}          # TipTap JSON document


class NoteRead(BaseModel):
    id: uuid.UUID
    trip_id: uuid.UUID
    title: str
    content: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NoteUpdate(BaseModel):
    title: str | None = None
    content: dict | None = None
