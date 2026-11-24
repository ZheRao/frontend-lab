# app/forecast_years/router.py

from fastapi import APIRouter, status, HTTPException

from app.forecast_years.schemas import ForecastYear
from app.forecast_years.service import list_years
import app.config as config

from app.conventions import OutcomeKind, BackendKeys

OUTCOME = BackendKeys.OUTCOME
RESULT = BackendKeys.RESULT


router = APIRouter(prefix="/forecast-years", tags=["forecast-years"])


@router.get("", status_code=status.HTTP_200_OK, response_model=list[ForecastYear])
def get_forecast_years():
    results = list_years(config.DB_PATH)

    if results[OUTCOME] == OutcomeKind.REFRESHED:
        return results[RESULT]
    elif results[OUTCOME] == OutcomeKind.DATABASE_BUSY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "SERVICE_BUSY",
                "message": "The backend is currently unavailable, please try again in a few seconds."
            }
        )
    else:
        raise RuntimeError("refresh forecast years failed in the backend")
