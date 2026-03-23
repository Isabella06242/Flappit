from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models.note import Note
from app.models.pin import Pin
from app.models.plan import Plan
from app.models.trip import Trip
from app.models.user import User
from app.services.ai import build_system_prompt

router = APIRouter(prefix="/ai", tags=["ai"])

MODE_HINTS: dict[str, str] = {
    "restaurant": (
        "Recommend specific restaurants near the pinned places. "
        "For each: name, cuisine, price range, and why it suits this traveller."
    ),
    "hotel": (
        "Based on where the pinned places are clustered, recommend nearby hotels. "
        "For each: name, star level, price range, and location advantage."
    ),
    "itinerary": (
        "Build a detailed day-by-day itinerary using ALL the pinned places. "
        "Group nearby pins per day, suggest timing, and add meal recommendations matching the budget."
    ),
    "notes": (
        "Help the user with travel writing. Expand, refine, translate, or summarise as asked."
    ),
    "chat": "",
}


class ChatRequest(BaseModel):
    message: str
    trip_id: str | None = None
    mode: str = "chat"


@router.post("/chat")
async def ai_chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()

    trip = pins = notes = None
    if req.trip_id:
        result = await db.execute(
            select(Trip).where(
                Trip.id == req.trip_id,
                Trip.owner_id == current_user.id,
            )
        )
        trip = result.scalar_one_or_none()
        if trip:
            pins_res = await db.execute(select(Pin).where(Pin.trip_id == trip.id))
            pins = list(pins_res.scalars().all())
            notes_res = await db.execute(select(Note).where(Note.trip_id == trip.id))
            notes = list(notes_res.scalars().all())

    system = build_system_prompt(current_user, trip, pins, notes)

    hint = MODE_HINTS.get(req.mode, "")
    user_message = f"{hint}\n\n{req.message}".strip() if hint else req.message

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def stream_response():
        stream = await client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1024,
            stream=True,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_message},
            ],
        )
        async for chunk in stream:
            text = chunk.choices[0].delta.content
            if text:
                safe = text.replace("\n", "\\n")
                yield f"data: {safe}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Travel plan generation ─────────────────────────────────────────────────────

PLAN_SCHEMA = """
Return ONLY valid JSON (no markdown, no prose) with this exact structure:
{
  "flights": [
    {"from": "...", "to": "...", "notes": "..."}
  ],
  "accommodation": [
    {"name": "...", "type": "hotel|airbnb|hostel", "area": "...", "price_range": "...", "why": "..."}
  ],
  "extras": [
    {"name": "...", "type": "restaurant|bakery|attraction|experience", "area": "...", "why": "..."}
  ],
  "days": [
    {
      "day": 1,
      "title": "...",
      "stops": [
        {"time": "09:00", "place": "...", "notes": "..."}
      ],
      "cost_estimate": "~$50",
      "transport_notes": "...",
      "steps_estimate": 8000
    }
  ]
}
"""


class PlanRequest(BaseModel):
    trip_id: str


@router.post("/plan")
async def generate_plan(
    req: PlanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()

    result = await db.execute(
        select(Trip).where(Trip.id == req.trip_id, Trip.owner_id == current_user.id)
    )
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    pins_res = await db.execute(select(Pin).where(Pin.trip_id == trip.id))
    pins = list(pins_res.scalars().all())
    notes_res = await db.execute(select(Note).where(Note.trip_id == trip.id))
    notes = list(notes_res.scalars().all())

    system = build_system_prompt(current_user, trip, pins, notes)
    user_message = (
        f"Generate a complete travel plan for this trip to {trip.title}. "
        f"Use the pinned places as the core of the itinerary. "
        f"Also suggest flights/trains from the user's likely origin if inferable, "
        f"accommodation near the pin clusters, and a few extra gems (restaurants, "
        f"bakeries, unique experiences) that match the user's profile.\n\n"
        f"{PLAN_SCHEMA}"
    )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model="gpt-4o",
        max_tokens=2048,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_message},
        ],
    )

    raw = response.choices[0].message.content or "{}"
    try:
        content = json.loads(raw)
    except json.JSONDecodeError:
        content = {"raw": raw}

    # Upsert plan (one plan per trip)
    plan_res = await db.execute(select(Plan).where(Plan.trip_id == trip.id))
    plan = plan_res.scalar_one_or_none()
    if plan:
        plan.content = content
    else:
        plan = Plan(trip_id=trip.id, content=content)
        db.add(plan)
    await db.flush()
    await db.refresh(plan)

    return {"id": str(plan.id), "trip_id": str(plan.trip_id), "content": plan.content}
