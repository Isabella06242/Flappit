from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Pin(Base):
    """
    A map pin belonging to a trip, optionally linked to a note.
    `lat` / `lng` are WGS-84 decimal degrees.
    `place_id` is a Google Maps / AMap place identifier for rich lookups.
    """
    __tablename__ = "pins"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), index=True
    )
    # Optional link to a note — delinking a note keeps the pin alive
    note_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("notes.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    place_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    color: Mapped[str] = mapped_column(String(16), nullable=False, default="#FF6B6B")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    trip: Mapped["Trip"] = relationship(back_populates="pins")  # noqa: F821
    note: Mapped[Optional["Note"]] = relationship(back_populates="pins")  # noqa: F821
