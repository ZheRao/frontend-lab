# app/definitions/routers.py

from fastapi import APIRouter 

from app.definitions.crops.router import router as crops_router

router = APIRouter(prefix="/definitions", tags=["definitions"])

router.include_router(crops_router)