from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str


class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    username: str
    age_group: str | None = None
    budget: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    username: str | None = None
    password: str | None = None


class ProfileUpdate(BaseModel):
    age_group: str | None = None  # student | 20s | 30s | 50s_plus
    budget: str | None = None     # budget | mid | luxury
