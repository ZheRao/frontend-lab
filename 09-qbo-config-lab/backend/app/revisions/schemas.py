# app/revisions/schemas.py

from pydantic import BaseModel 

class Revision(BaseModel):
    id: int 
    name: str 
    revision_order: int 
    modified_by: str 
    modified_at: str