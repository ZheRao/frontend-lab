# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.clients.router import router as clients_router
from app.forecast.routers import router as forecast_routers
from app.definitions.routers import router as definition_routers

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST", "GET", "PATCH", "DELETE"],
    allow_headers=["*"]
)

app.include_router(clients_router)
app.include_router(forecast_routers)
app.include_router(definition_routers)