# tests/forecast/inputs/crop_plan/helpers.py

import sqlite3
from app.forecast.inputs.crop_plan.service import create_record

def committed_crop_plan(db_path):
    """returns a list of committed crop plan records with all columns"""
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.execute(
            """
            SELECT id, client_id, forecast_year, crop_id, revision_id, category_key, value, modified_by, memo, created_at
            FROM crop_plan
            ORDER BY id DESC
            """
        )
        cols = [c[0] for c in cur.description]
        rows = cur.fetchall()
        return [dict(zip(cols, row)) for row in rows]
    finally:
        conn.close()

def use_create_record(
    db_path,
    client_ids,
):
    """return the function that can swap in any subfields for create_record"""
    client_id = client_ids[0]
    def create(
        client_id: int=client_id,
        forecast_year: int=2026,
        crop_id: int=1,
        revision_id: int=1,
        category_key: str="unit_price",
        value: float=100,
        memo: str|None=None,
        modified_by: str="Test User"
    ):
        result = create_record(
            db_path,
            client_id,
            forecast_year,
            crop_id,
            revision_id,
            category_key,
            value,
            modified_by,
            memo
        )
        return result 

    return create 