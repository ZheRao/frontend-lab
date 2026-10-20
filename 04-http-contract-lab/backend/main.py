from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from simulated_client_service import simulate_create_client

class ClientCreateRequest(BaseModel):
    name: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST"],
    allow_headers=["*"]
)

@app.post("/clients", status_code=status.HTTP_201_CREATED)
def create_client(payload: ClientCreateRequest):
    result = simulate_create_client(name=payload.name)

    if result["outcome"]=="created":
        return result["client"]
    elif result["outcome"]=="duplicate_client":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_CLIENT",
                "message": "A client with this name already exists."
            }
        )
    else:
        raise RuntimeError("Unrecognized business outcome")