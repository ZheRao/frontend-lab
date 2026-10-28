import sqlite3
from app.db.errors import DBErrorKind

def translate_sqlite_error(err: BaseException) -> DBErrorKind:
    """
    Inspect supplied exception and return its classification
    - case
        - not SQLite error -> DBErrorKind.UNRECOGNIZED
        - no `sqlite_errorname` -> DBErrorKind.UNRECOGNIZED
        - if `'sqlite_busy' in error_name.lower()` -> DBErrorKind.BUSY
        - error name
            - 'SQLITE_CONSTRAINT_UNIQUE' -> DBErrorKind.UNIQUE
            - 'SQLITE_CONSTRAINT_NOTNULL' -> DBErrorKind.NOT_NULL
            - 'SQLITE_CONSTRAINT_FOREIGNKEY' -> DBErrorKind.FOREIGN_KEY
            - 'SQLITE_CONSTRAINT_TRIGGER'
                - if error message contains 'foreign key' -> DBErrorKind.FOREIGN_KEY
                - if error message doesn't contain 'foreign key' -> DBErrorKind.UNRECOGNIZED
        - else -> DBErrorKind.UNRECOGNIZED
    """
    if not isinstance(err, sqlite3.Error): return DBErrorKind.UNRECOGNIZED

    error_name = getattr(err, "sqlite_errorname", None)

    if not error_name: return DBErrorKind.UNRECOGNIZED

    if error_name.startswith("SQLITE_BUSY"): return DBErrorKind.BUSY

    match error_name:
        case "SQLITE_CONSTRAINT_UNIQUE": return DBErrorKind.UNIQUE
        case "SQLITE_CONSTRAINT_NOTNULL": return DBErrorKind.NOT_NULL
        case "SQLITE_CONSTRAINT_FOREIGNKEY": return DBErrorKind.FOREIGN_KEY
        case "SQLITE_CONSTRAINT_TRIGGER": 
            if "foreign key" in str(err).lower():
                return DBErrorKind.FOREIGN_KEY
            else:
                return DBErrorKind.UNRECOGNIZED

    return DBErrorKind.UNRECOGNIZED