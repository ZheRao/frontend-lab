# app/crops/schemas.py

from pydantic import BaseModel 

class Crop(BaseModel):
    id: int 
    name: str 
    modified_by: str 
    modified_at: str 