from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from simulated_client_service import append_client, client_list, modify_client, remove_client

class ClientModifyRequest(BaseModel):
    name: str

class Client(BaseModel):
    id: int
    name: str 
    modified_by: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST", "GET", "PATCH", "DELETE"],
    allow_headers=["*"]
)

@app.get("/clients", response_model=list[Client])
def get_client():
    result = client_list(success=True)
    if result is not None:
        return result
    else:
        raise RuntimeError("refresh failed in the backend")

@app.post("/clients", status_code=status.HTTP_201_CREATED, response_model=Client)
def create_client(payload: ClientModifyRequest):
    result = append_client(name=payload.name, outcome="normal")

    if result:
        if result["outcome"]=="created":
            return result["result"]
        elif result["outcome"]=="duplicated":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "DUPLICATE_CLIENT",
                    "message": "A client with this name already exists."
                }
            )

    raise RuntimeError("Unrecognized business outcome")


@app.patch("/clients/{client_id}", response_model=Client)
def update_client(client_id: int, payload: ClientModifyRequest):
    result = modify_client(client_id, payload.name, outcome="normal")

    if result:
        if result["outcome"] == "updated":
            return result["result"]
        elif result["outcome"] == "not_found":
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "CLIENT_NOT_FOUND",
                    "message": "The client does not exist in the database."
                }
            )
        elif result["outcome"] == "duplicated":
            raise HTTPException(
                status_code = status.HTTP_409_CONFLICT,
                detail={
                    "code": "DUPLICATE_CLIENT",
                    "message": "A client with this name already exists."
                }
            )
    raise RuntimeError("Unrecognized business outcome")

@app.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: int):
    result = remove_client(client_id, outcome="normal")

    if result:
        if result["outcome"] == "deleted":
            return 
        elif result["outcome"] == "not_found":
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "CLIENT_NOT_FOUND",
                    "message": "The client does not exist in the database."
                }
            )
        elif result["outcome"] == "referenced":
            raise HTTPException(
                status_code = status.HTTP_409_CONFLICT,
                detail={
                    "code": "CLIENT_REFERENCED",
                    "message": "This client cannot be deleted because it is referenced by other records."
                }
            )
    raise RuntimeError("Unrecognized business outcome")