from app.conventions import BackendKeys, OutcomeKind, DBErrorKind
from app.db.sqlite_connection import unit_of_work
from app.db.sqlite_errors import translate_sqlite_error # SQLite-specific
from app.services.naming import string_normalize

def client_list(db_path:str) -> dict[str,list[dict[str,str|int]]|str]:
    query = """
        SELECT id, name, modified_by
        FROM clients
        ORDER BY id
    """
    try:
        with unit_of_work(db_path) as conn:
            cur = conn.execute(query)
            cols = [c[0] for c in cur.description]
            rows = cur.fetchall()
            return {
                BackendKeys.OUTCOME: OutcomeKind.REFRESHED,
                BackendKeys.RESULT: [dict(zip(cols, row)) for row in rows]
            }
    except Exception as err:
        kind = translate_sqlite_error(err)
        if kind == DBErrorKind.BUSY:
            return {
                BackendKeys.OUTCOME: OutcomeKind.DATABASE_BUSY
            }
        return {
            BackendKeys.OUTCOME: OutcomeKind.UNKNOWN
        }


def append_client(db_path:str, name: str, modified_by: str="TEST USER") -> dict[str, dict[str,str|int]|str]:
    name_standardized = string_normalize(name)
    if name_standardized == "":
        return {
            BackendKeys.OUTCOME: OutcomeKind.INVALID_NAME
        }
    try:
        with unit_of_work(db_path) as conn:
            sql = """
                INSERT INTO clients (name, name_standardized, modified_by) 
                VALUES (?, ?, ?)
                RETURNING id, name, modified_by
            """
            cur = conn.execute(sql, (name.strip(), name_standardized, modified_by))
            cols = [c[0] for c in cur.description]
            row = cur.fetchall()
        return {
            BackendKeys.OUTCOME: OutcomeKind.CREATED,
            BackendKeys.RESULT: dict(zip(cols, row[0]))
        }
    except BaseException as err:
        kind = translate_sqlite_error(err)
        if kind == DBErrorKind.UNIQUE:
            return {
                BackendKeys.OUTCOME: OutcomeKind.DUPLICATED
            }
        elif kind == DBErrorKind.BUSY:
            return {
                BackendKeys.OUTCOME: OutcomeKind.DATABASE_BUSY
            }
        return {
            BackendKeys.OUTCOME: OutcomeKind.UNKNOWN
        }

def modify_client(db_path: str, client_id: int, name: str, modified_by: str = "Test User") -> dict[str, dict[str,str|int]|str]:
    name_standardized = string_normalize(name)
    if name_standardized == "":
        return {
            BackendKeys.OUTCOME: OutcomeKind.INVALID_NAME
        }
    try:
        with unit_of_work(db_path) as conn:
            cur = conn.execute(
                """
                UPDATE clients
                SET name=?, name_standardized=?, modified_by=?
                WHERE id=?
                RETURNING id, name, modified_by
                """,
                (name.strip(), name_standardized, modified_by, client_id)
            )
            cols = [c[0] for c in cur.description]
            rows = cur.fetchall()
        if not rows:
            return {
                BackendKeys.OUTCOME: OutcomeKind.NOT_FOUND
            }
        else:
            return {
                BackendKeys.OUTCOME: OutcomeKind.UPDATED,
                BackendKeys.RESULT: dict(zip(cols, rows[0]))
            }
    except Exception as err:
        kind = translate_sqlite_error(err)
        if kind == DBErrorKind.UNIQUE:
            return {
                BackendKeys.OUTCOME: OutcomeKind.DUPLICATED
            }
        elif kind == DBErrorKind.BUSY:
            return {
                BackendKeys.OUTCOME: OutcomeKind.DATABASE_BUSY
            }
        return {
            BackendKeys.OUTCOME: OutcomeKind.UNKNOWN
        }