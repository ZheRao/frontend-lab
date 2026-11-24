# app.crop_plan.service.py
import sqlite3
from app.db.sqlite_errors import translate_sqlite_error
from app.conventions import OutcomeKind, BackendKeys, DBErrorKind
from app.db.sqlite_connection import unit_of_work

OUTCOME = BackendKeys.OUTCOME
RESULT = BackendKeys.RESULT

import time


def retrieve_records(
    db_path: str,
    client_id: int,
    forecast_year: int
) -> dict[str, str|list[dict[str,str|int|float]]]:
    """execute GET crop_plan SQL, interpret SQLite errors"""
    try:
        with unit_of_work(db_path) as conn:
            query = """
                    SELECT id, client_id, forecast_year, crop_id, revision_id, category_key, value, modified_by, memo, created_at
                    FROM crop_plan
                    WHERE client_id=? AND forecast_year=?
                    ORDER BY id DESC
                    """
            cur = conn.execute(query, (client_id, forecast_year))
            cols = [c[0] for c in cur.description]
            rows = cur.fetchall()
            results = [dict(zip(cols, row)) for row in rows]
        return {
            OUTCOME: OutcomeKind.REFRESHED,
            RESULT: results
        }
    except sqlite3.Error as err:
        kind = translate_sqlite_error(err)
        if kind == DBErrorKind.BUSY:
            return {
                OUTCOME: OutcomeKind.DATABASE_BUSY
            }
        return {
            OUTCOME: OutcomeKind.UNKNOWN
        }

def retrieve_categories(db_path: str) -> dict[str, str|list[dict[str,str|int|float]]]:
    """execute GET crop_plan_categories SQL, interpret SQLite errors"""
    try:
        with unit_of_work(db_path) as conn:
            query = """
                    SELECT key, crop_year, label, unit
                    FROM crop_plan_categories
                    """
            cur = conn.execute(query)
            cols = [c[0] for c in cur.description]
            rows = cur.fetchall()
            results = [dict(zip(cols, row)) for row in rows]
        return {
            OUTCOME: OutcomeKind.REFRESHED,
            RESULT: results
        }
    except sqlite3.Error as err:
        kind = translate_sqlite_error(err)
        if kind == DBErrorKind.BUSY:
            return {
                OUTCOME: OutcomeKind.DATABASE_BUSY
            }
        return {
            OUTCOME: OutcomeKind.UNKNOWN
        }

def create_record(
    db_path: str,
    client_id: int,
    forecast_year: int,
    crop_id: int,
    revision_id: int,
    category_key: str,
    value: float,
    modified_by: str,
    memo: str|None = None,
) -> dict[str, str| dict[str,str|int|float]]:
    if value < 0:
        return {
            OUTCOME: OutcomeKind.INVALID_VALUE
        }
    
    try:
        with unit_of_work(db_path) as conn:
            # time.sleep(5)
            cur = conn.execute(
                """
                INSERT INTO crop_plan (client_id, forecast_year, crop_id, revision_id, category_key, value, modified_by, memo)
                VALUES (?,?,?,?,?,?,?,?)
                RETURNING id, client_id, forecast_year, crop_id, revision_id, category_key, value, modified_by, memo, created_at
                """,
                (client_id, forecast_year, crop_id, revision_id, category_key, value, modified_by, memo)
            )
            cols = [c[0] for c in cur.description]
            row = cur.fetchall()[0]
            result = dict(zip(cols, row))
        return {
            OUTCOME: OutcomeKind.CREATED,
            RESULT: result
        }
    except sqlite3.Error as err:
        kind = translate_sqlite_error(err)
        if kind == DBErrorKind.BUSY:
            return {
                OUTCOME: OutcomeKind.DATABASE_BUSY
            }
        elif kind == DBErrorKind.FOREIGN_KEY:
            return {
                OUTCOME: OutcomeKind.INVALID_REFERENCE
            }
        return {
            OUTCOME: OutcomeKind.UNKNOWN
        }

