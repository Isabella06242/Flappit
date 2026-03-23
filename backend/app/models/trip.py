from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    owner: Mapped["User"] = relationship(back_populates="trips")  # noqa: F821
    notes: Mapped[list["Note"]] = relationship(  # noqa: F821
        back_populates="trip", cascade="all, delete-orphan"
    )
    pins: Mapped[list["Pin"]] = relationship(  # noqa: F821
        back_populates="trip", cascade="all, delete-orphan"
    )
    plan: Mapped[Optional["Plan"]] = relationship(  # noqa: F821
        back_populates="trip", cascade="all, delete-orphan", uselist=False
    )
