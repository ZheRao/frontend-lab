from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from simulated_client_service import append_client, client_list

class ClientCreateRequest(BaseModel):
    name: str

class Client(BaseModel):
    id: int
    name: str 
    modified_by: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"]
)

@app.get("/clients", response_model=list[Client])
def get_client():
    result = client_list()
    return result

@app.post("/clients", status_code=status.HTTP_201_CREATED, response_model=Client)
def create_client(payload: ClientCreateRequest):
    result = append_client(name=payload.name)

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