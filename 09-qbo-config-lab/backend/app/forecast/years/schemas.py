# app/forecast/years/schemas.py

from pydantic import BaseModel

class ForecastYear(BaseModel):
    forecast_year: int
    modified_at: str 
    modified_by: str