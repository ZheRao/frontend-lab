from enum import StrEnum

class DBErrorKind(StrEnum):
    """
    Database-neutral classification of a driver exception
    """
    UNIQUE = "unique"
    NOT_NULL = "not_null"
    FOREIGN_KEY = "foreign_key"
    BUSY = "busy"
    UNRECOGNIZED = "unrecognized"

class OutcomeKind(StrEnum):
    """
    Backend-Database communication outcomes
    """
    REFRESHED = "refreshed"
    CREATED = "created"
    DUPLICATED = "duplicated"
    INVALID_NAME = "invalid_name"
    INVALID_VALUE = "invalid_value"
    DATABASE_BUSY = "database_busy"
    NOT_FOUND = "not_found"
    UPDATED = "updated"
    DELETED = "deleted"
    REFERENCED = "referenced"
    INVALID_REFERENCE = "invalid_reference"
    UNKNOWN = "unknown"

class BackendKeys(StrEnum):
    """
    Backend-Database communication JSON keys
    """
    OUTCOME = "outcome"
    RESULT = "result"