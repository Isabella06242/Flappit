from fastapi import APIRouter

from app.api.v1 import ai, auth, trips, notes, pins

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(trips.router)
router.include_router(notes.router)
router.include_router(pins.router)
router.include_router(ai.router)
