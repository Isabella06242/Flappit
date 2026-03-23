from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Note(Base):
    """
    A free-form note inside a trip.
    `content` is stored as JSONB — a TipTap/block-editor document tree.
    Example content shape:
        {
          "type": "doc",
          "content": [
            { "type": "paragraph", "content": [{"type": "text", "text": "Hello!"}] }
          ]
        }
    """
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), index=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Untitled note")
    # Block-editor content stored as flexible JSON
    content: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    trip: Mapped["Trip"] = relationship(back_populates="notes")  # noqa: F821
    pins: Mapped[list["Pin"]] = relationship(  # noqa: F821
        back_populates="note"
    )
