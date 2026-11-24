# app/clients/schemas.py

from pydantic import BaseModel

class ClientModifyRequest(BaseModel):
    name: str

class Client(BaseModel):
    id: int
    name: str 
    modified_by: str