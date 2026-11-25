# app/forecast/routers.py

from fastapi import APIRouter

from app.forecast.years.router import router as years_router
from app.forecast.revisions.router import router as revisions_router
from app.forecast.inputs.routers import router as input_routers

router = APIRouter(prefix="/forecast", tags=["forecast"])

router.include_router(years_router)
router.include_router(revisions_router)
router.include_router(input_routers)