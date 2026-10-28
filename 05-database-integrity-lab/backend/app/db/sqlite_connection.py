import sqlite3
from contextlib import contextmanager

from app.config import BUSY_TIMEOUT

def get_connection(db_path: str, timeout: float|None = None) -> sqlite3.Connection:
    """
    Establish a connection, enable and verify foreign-key enforcement, return the configured connection
    """
    if timeout is None:
        timeout = BUSY_TIMEOUT
    conn = sqlite3.connect(db_path, autocommit=True, timeout=timeout)
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        fk_check = conn.execute("PRAGMA foreign_keys").fetchone()[0]
        if fk_check != 1:
            raise RuntimeError("Connection with FK constraint cannot be established.")
        conn.autocommit = False 
    except:
        conn.close()
        raise
    return conn 

@contextmanager
def unit_of_work(db_path: str, timeout: float|None = None):
    """
    Actions:
        - acquire database connection
        - execute SQL statements
        - commit on successful completion
        - rollback on exceptions
        - close the connection
    """
    if timeout is None:
        timeout = BUSY_TIMEOUT
    try:
        conn = get_connection(db_path, timeout=timeout)
    except RuntimeError as err:
        raise RuntimeError("Database connection failed") from err

    try:
        yield conn
        conn.commit()
    except BaseException:
        try:
            conn.rollback()
        except sqlite3.Error:
            pass
        raise
    finally:
        conn.close()
    