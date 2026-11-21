# app/crops/router.py

from fastapi import APIRouter, status, HTTPException

from app.crops.service import list_crops
import app.config as config
from app.crops.schemas import Crop
from app.conventions import OutcomeKind, BackendKeys

OUTCOME = BackendKeys.OUTCOME
RESULT = BackendKeys.RESULT

router = APIRouter(prefix="/crops", tags=["crops"])


@router.get("", status_code=status.HTTP_200_OK, response_model=list[Crop])
def get_crops():
    result = list_crops(config.DB_PATH)
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
        raise RuntimeError("refresh crops failed in the backend")