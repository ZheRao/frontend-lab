# app/forecast/inputs/routers.py

from fastapi import APIRouter

from app.forecast.inputs.crop_plan.router import router as crop_plan_router

router = APIRouter(prefix="/inputs", tags=["inputs"])

router.include_router(crop_plan_router)