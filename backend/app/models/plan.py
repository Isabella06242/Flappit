from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Plan(Base):
    """
    AI-generated travel plan for a trip.
    `content` holds the full structured plan as JSON:
    {
      "flights": [...],
      "accommodation": [...],
      "extras": [...],
      "days": [
        {
          "day": 1,
          "title": "...",
          "stops": [...],
          "cost_estimate": "...",
          "transport_notes": "...",
          "steps_estimate": 8000
        }
      ]
    }
    """
    __tablename__ = "plans"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), index=True, unique=True
    )

    content: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    trip: Mapped["Trip"] = relationship(back_populates="plan")  # noqa: F821
