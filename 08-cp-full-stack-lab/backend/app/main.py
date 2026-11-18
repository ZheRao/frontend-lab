# app/main.py

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.clients.router import router as clients_router
from app.crop_plan.router import router as crop_plan_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST", "GET", "PATCH", "DELETE"],
    allow_headers=["*"]
)

app.include_router(clients_router)
app.include_router(crop_plan_router)