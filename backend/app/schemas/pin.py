from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel


class PinCreate(BaseModel):
    title: str
    lat: float
    lng: float
    place_id: str | None = None
    note_id: uuid.UUID | None = None
    color: str = "#FF6B6B"


class PinRead(BaseModel):
    id: uuid.UUID
    trip_id: uuid.UUID
    note_id: uuid.UUID | None
    title: str
    lat: float
    lng: float
    place_id: str | None
    color: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PinUpdate(BaseModel):
    title: str | None = None
    lat: float | None = None
    lng: float | None = None
    place_id: str | None = None
    note_id: uuid.UUID | None = None
    color: str | None = None
