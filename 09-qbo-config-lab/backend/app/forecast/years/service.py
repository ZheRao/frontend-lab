# app/forecast/years/service.py

import sqlite3

from app.db.sqlite_connection import unit_of_work
from app.db.sqlite_errors import translate_sqlite_error

from app.conventions import DBErrorKind, OutcomeKind, BackendKeys

OUTCOME = BackendKeys.OUTCOME
RESULT = BackendKeys.RESULT


def list_years(db_path:str) -> dict[str, str | list[dict[str, str|int]]]:
    try:
        with unit_of_work(db_path) as conn:
            cur = conn.execute(
                """
                SELECT forecast_year, modified_at, modified_by 
                FROM forecast_years
                ORDER BY forecast_year
                """
            )
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

