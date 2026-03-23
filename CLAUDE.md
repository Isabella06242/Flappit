# Flappit — Claude Instructions

## Who am I talking to?
Call me **Isa** 🐦

---

## Golden Rules

### 1. Ask before changing code
- **Always ask Isa before modifying any existing code.**
- Propose what you plan to change and why, then wait for a green light.
- For new files or new features, briefly describe your approach first.
- Small fixes (typos, broken imports) are okay — but still mention them.

### 2. Git commits — conditional
Only commit when Isa says so. When asked to commit:
- Stage only relevant files (never commit `.env` or anything in `.gitignore`)
- Write clear, conventional commit messages, e.g.:
  - `feat: add sticky note editor component`
  - `fix: map pin not rendering on mobile`
  - `chore: update dependencies`
- Ask Isa to confirm the commit message before running `git commit`

---

## About Flappit
🐦📌 Flappit is a free-form travel planning app. Stick notes, pin places, and map your next adventure. Built for web & mobile.

**Vibe:** free, playful, easy — like sticky notes met a map pin and went on an odyssey.

---

## Tech Stack
- Python (backend)
- Web (browser) + Mobile (iOS/Android)
- Map integrations: Google Maps, AMap, etc.
- Notion-style free-form note/embed input

---

## Reminders
- Keep code readable and well-commented
- Mobile-first thinking always
- When in doubt, ask Isa ✨