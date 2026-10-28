from enum import StrEnum

class DBErrorKind(StrEnum):
    """
    Database-neutral classification of a driver exception
    """
    UNIQUE = "unique"
    NOT_NULL = "not_null"
    FOREIGN_KEY = "foreign_key"
    TRIGGER = "trigger"
    BUSY = "busy"
    UNRECOGNIZED = "unrecognized"