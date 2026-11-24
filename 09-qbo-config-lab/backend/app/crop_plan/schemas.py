# app.crop_plan.schemas.py

from pydantic import BaseModel 

class CropPlanData(BaseModel):
    id: int 
    client_id: int 
    forecast_year: int 
    crop_id: int 
    revision_id: int 
    category_key: str 
    value: float
    modified_by: str 
    memo: str|None
    created_at: str

class CropPlanCategory(BaseModel):
    key: str
    crop_year: str 
    label: str 
    unit: str 

class CropPlanCreateRequest(BaseModel):
    client_id: int
    forecast_year: int
    crop_id: int
    revision_id: int
    category_key: str
    value: float
    memo: str|None