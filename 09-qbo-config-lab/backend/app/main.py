# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.clients.router import router as clients_router
from app.crop_plan.router import router as crop_plan_router
from app.forecast_years.router import router as forecast_year_router
from app.crops.router import router as crops_router
from app.revisions.router import router as revisions_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST", "GET", "PATCH", "DELETE"],
    allow_headers=["*"]
)

app.include_router(clients_router)
app.include_router(crop_plan_router)
app.include_router(forecast_year_router)
app.include_router(crops_router)
app.include_router(revisions_router)