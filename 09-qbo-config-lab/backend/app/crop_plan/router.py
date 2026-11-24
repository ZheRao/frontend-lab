# app/crop_plan/router.py

from fastapi import APIRouter, status, HTTPException, Depends
from app.conventions import OutcomeKind, BackendKeys
from app.crop_plan.service import create_record, retrieve_records, retrieve_categories
from app.crop_plan.schemas import CropPlanData, CropPlanCategory, CropPlanCreateRequest
import app.config as config
from app.identity import current_user

OUTCOME = BackendKeys.OUTCOME
RESULT = BackendKeys.RESULT

router = APIRouter(prefix='/crop-plan', tags=["crop-plan"])

ERROR_DETAIL = {
    "DATABASE_BUSY": {
        "code": "SERVICE_BUSY",
        "message": "The backend is currently unavailable, please try again in a few seconds."
    },
    "INVALID_VALUE": {
        "code": "INVALID_VALUE",
        "message": "Field value should be a number, cannot be empty, or being negative."
    },
    "INVALID_REFERENCE": {
        "code": "INVALID_REFERENCE",
        "message": "The client, crop, revision does not exist."
    }
}

@router.get("/{client_id}/{forecast_year}", status_code=status.HTTP_200_OK, response_model=list[CropPlanData])
def retrieve_crop_plan(client_id: int, forecast_year: int):
    result = retrieve_records(config.DB_PATH, client_id, forecast_year)
    if result[OUTCOME] == OutcomeKind.REFRESHED:
        return result[RESULT]
    elif result[OUTCOME] == OutcomeKind.DATABASE_BUSY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=ERROR_DETAIL["DATABASE_BUSY"]
        )
    else:
        raise RuntimeError("refresh crop plan failed in the backend")

@router.get("/categories", status_code=status.HTTP_200_OK, response_model=list[CropPlanCategory])
def retrieve_crop_plan_category():
    result = retrieve_categories(config.DB_PATH)
    if result[OUTCOME] == OutcomeKind.REFRESHED:
        return result[RESULT]
    elif result[OUTCOME] == OutcomeKind.DATABASE_BUSY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=ERROR_DETAIL["DATABASE_BUSY"]
        )
    else:
        raise RuntimeError("refresh crop plan category failed in the backend")
    
@router.post("", status_code=status.HTTP_201_CREATED, response_model=CropPlanData)
def create_crop_plan(payload: CropPlanCreateRequest, user:str = Depends(current_user)):
    result = create_record(
        config.DB_PATH,
        payload.client_id,
        payload.forecast_year,
        payload.crop_id,
        payload.revision_id,
        payload.category_key,
        payload.value,
        user,
        payload.memo,
    )
    if result[OUTCOME] == OutcomeKind.CREATED:
        return result[RESULT]
    elif result[OUTCOME] == OutcomeKind.INVALID_VALUE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=ERROR_DETAIL["INVALID_VALUE"]
        )
    elif result[OUTCOME] == OutcomeKind.DATABASE_BUSY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=ERROR_DETAIL["DATABASE_BUSY"]
        )
    elif result[OUTCOME] == OutcomeKind.INVALID_REFERENCE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=ERROR_DETAIL["INVALID_REFERENCE"]
        )
    raise RuntimeError("Unrecognized business outcome")