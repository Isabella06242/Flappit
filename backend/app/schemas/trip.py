from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel


class TripCreate(BaseModel):
    title: str
    description: str | None = None
    cover_image_url: str | None = None


class TripRead(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    title: str
    description: str | None
    cover_image_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TripUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    cover_image_url: str | None = None
