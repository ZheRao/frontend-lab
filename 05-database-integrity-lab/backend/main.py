from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from app.services.client_service import append_client, client_list, modify_client, remove_client
from app.config import DB_NAME
from app.conventions import OutcomeKind, BackendKeys

DB_PATH = f"./{DB_NAME}"

OUTCOME = BackendKeys.OUTCOME
RESULT = BackendKeys.RESULT

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

@app.get("/clients", response_model=list[Client], status_code=status.HTTP_200_OK)
def get_client():
    result = client_list(DB_PATH)
    if result[OUTCOME] == OutcomeKind.REFRESHED:
        return result[RESULT]
    elif result[OUTCOME] == OutcomeKind.DATABASE_BUSY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "SERVICE_BUSY",
                "message": "The backend is currently unavailable, please try again in a few seconds."
            }
        )
    else:
        raise RuntimeError("refresh failed in the backend")

@app.post("/clients", status_code=status.HTTP_201_CREATED, response_model=Client)
def create_client(payload: ClientModifyRequest):
    result = append_client(DB_PATH, name=payload.name)

    if result[OUTCOME]==OutcomeKind.CREATED:
        return result[RESULT]
    elif result[OUTCOME]==OutcomeKind.DUPLICATED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_CLIENT",
                "message": "A client with this name already exists."
            }
        )
    elif result[OUTCOME] == OutcomeKind.DATABASE_BUSY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "SERVICE_BUSY",
                "message": "The backend is currently unavailable, please try again in a few seconds."
            }
        )
    elif result[OUTCOME]==OutcomeKind.INVALID_NAME:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "INVALID_CLIENT_NAME",
                "message": "Client name cannot be empty or consist only of whitespace."
            }
        )

    raise RuntimeError("Unrecognized business outcome")


@app.patch("/clients/{client_id}", response_model=Client, status_code=status.HTTP_200_OK)
def update_client(client_id: int, payload: ClientModifyRequest):
    result = modify_client(DB_PATH, client_id, payload.name)

    if result[OUTCOME] == OutcomeKind.UPDATED:
        return result[RESULT]
    elif result[OUTCOME] == OutcomeKind.NOT_FOUND:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail={
                "code": "CLIENT_NOT_FOUND",
                "message": "The client does not exist in the database."
            }
        )
    elif result[OUTCOME] == OutcomeKind.DUPLICATED:
        raise HTTPException(
            status_code = status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_CLIENT",
                "message": "A client with this name already exists."
            }
        )
    elif result[OUTCOME]==OutcomeKind.INVALID_NAME:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "INVALID_CLIENT_NAME",
                "message": "Client name cannot be empty or consist only of whitespace."
            }
        )
    elif result[OUTCOME] == OutcomeKind.DATABASE_BUSY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "SERVICE_BUSY",
                "message": "The backend is currently unavailable, please try again in a few seconds."
            }
        )
    raise RuntimeError("Unrecognized business outcome")

@app.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: int):
    result = remove_client(DB_PATH, client_id)

    if result[OUTCOME] == OutcomeKind.DELETED:
        return 
    elif result[OUTCOME] == OutcomeKind.NOT_FOUND:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail={
                "code": "CLIENT_NOT_FOUND",
                "message": "The client does not exist in the database."
            }
        )
    elif result[OUTCOME] == OutcomeKind.REFERENCED:
        raise HTTPException(
            status_code = status.HTTP_409_CONFLICT,
            detail={
                "code": "CLIENT_REFERENCED",
                "message": "This client cannot be deleted because it is referenced by other records."
            }
        )
    elif result[OUTCOME] == OutcomeKind.DATABASE_BUSY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "SERVICE_BUSY",
                "message": "The backend is currently unavailable, please try again in a few seconds."
            }
        )
    raise RuntimeError("Unrecognized business outcome")