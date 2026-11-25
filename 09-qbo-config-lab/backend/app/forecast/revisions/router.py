# app/forecast/revisions/router.py

from fastapi import HTTPException, APIRouter, status

from app.forecast.revisions.service import list_revisions
from app.forecast.revisions.schemas import Revision
import app.config as config
from app.conventions import BackendKeys, OutcomeKind

OUTCOME = BackendKeys.OUTCOME
RESULT = BackendKeys.RESULT

router = APIRouter(prefix="/revisions", tags=["revisions"])

@router.get("", status_code=status.HTTP_200_OK, response_model = list[Revision])
def get_revisions():
    result = list_revisions(config.DB_PATH)
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
        raise RuntimeError("refresh revisions failed in the backend")