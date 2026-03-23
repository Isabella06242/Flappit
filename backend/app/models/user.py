from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Travel profile — used to personalise AI recommendations
    # age_group: student | 20s | 30s | 50s_plus
    age_group: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    # budget: budget | mid | luxury
    budget: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    trips: Mapped[list["Trip"]] = relationship(  # noqa: F821
        back_populates="owner", cascade="all, delete-orphan"
    )
