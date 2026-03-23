from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.trip import Trip
    from app.models.pin import Pin
    from app.models.note import Note

AGE_LABELS = {
    "student": "Student",
    "20s": "20s",
    "30s": "30s",
    "50s_plus": "50+",
}

BUDGET_LABELS = {
    "budget": "Budget (💰) — hostels, street food, free attractions",
    "mid": "Mid-range (💰💰) — comfortable hotels, local restaurants",
    "luxury": "Luxury (💰💰💰) — boutique hotels, fine dining, exclusive experiences",
}

BUDGET_GUIDANCE = {
    "budget": "Prioritise free or cheap options. Street food, dorms, public transport.",
    "mid": "Balance quality and cost. 3-star hotels, sit-down local restaurants, occasional splurge.",
    "luxury": "Recommend premium experiences. 5-star hotels, Michelin-starred or well-reviewed fine dining, private tours.",
}

AGE_GUIDANCE = {
    "student": "Social atmosphere matters. Hostels with common areas, trendy cafés, night markets, budget hacks.",
    "20s": "Mix of trendy and adventurous. Hip neighbourhoods, instagrammable spots, good nightlife options.",
    "30s": "Comfort and quality. Good transport links, well-reviewed restaurants, a mix of culture and leisure.",
    "50s_plus": "Comfort and accessibility. Clear transport options, well-reviewed hotels, cultural depth, avoid overly strenuous activities.",
}


def build_system_prompt(
    user: "User",
    trip: "Trip | None" = None,
    pins: "list[Pin] | None" = None,
    notes: "list[Note] | None" = None,
) -> str:
    profile_lines: list[str] = []

    if user.age_group:
        profile_lines.append(f"- Age group: {AGE_LABELS.get(user.age_group, user.age_group)}")
        if user.age_group in AGE_GUIDANCE:
            profile_lines.append(f"  → {AGE_GUIDANCE[user.age_group]}")

    if user.budget:
        profile_lines.append(f"- Budget: {BUDGET_LABELS.get(user.budget, user.budget)}")
        if user.budget in BUDGET_GUIDANCE:
            profile_lines.append(f"  → {BUDGET_GUIDANCE[user.budget]}")

    profile_text = (
        "\n".join(profile_lines)
        if profile_lines
        else "- No profile set — give balanced recommendations."
    )

    trip_context = ""
    if trip:
        trip_context = f"\n\nCurrent trip: {trip.title}"
        if pins:
            pin_lines = "\n".join(
                f"  • {p.title} (lat {p.lat:.4f}, lng {p.lng:.4f})"
                for p in pins
            )
            trip_context += f"\nPinned places:\n{pin_lines}"
        if notes:
            note_lines = "\n".join(f"  • {n.title}" for n in notes if n.title)
            if note_lines:
                trip_context += f"\nTrip notes:\n{note_lines}"

    return f"""You are a friendly, expert travel planning assistant inside Flappit — a free-form travel planning app.

User profile:
{profile_text}{trip_context}

Always tailor your recommendations precisely to the user's age group and budget.
Be specific: name actual places, neighbourhoods, price ranges. Keep responses concise and scannable.
Use bullet points or short paragraphs. No fluff."""
