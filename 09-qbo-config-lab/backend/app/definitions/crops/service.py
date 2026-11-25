# app/definitions/crops/service.py
import sqlite3
from app.db.sqlite_connection import unit_of_work
from app.db.sqlite_errors import translate_sqlite_error

from app.conventions import DBErrorKind, BackendKeys, OutcomeKind

OUTCOME = BackendKeys.OUTCOME
RESULT = BackendKeys.RESULT


def list_crops(db_path: str) -> dict[str, str | list[dict[str, str|int]]]:
    try:
        with unit_of_work(db_path) as conn:
            cur = conn.execute(
                """
                SELECT id, name, modified_by, modified_at
                FROM crops
                ORDER BY id
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
        else:
            return {
                OUTCOME: OutcomeKind.UNKNOWN
            }