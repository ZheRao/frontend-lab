import sqlite3
import pytest 

from app.conventions import BackendKeys, OutcomeKind
from app.services.client_service import client_list, append_client 
from tests.helpers import committed_names

OUTCOME, RESULT = BackendKeys.OUTCOME, BackendKeys.RESULT

#   --- client list ----------------------------------

def test_empty_list(db_path):
    result = client_list(db_path)
    assert result[OUTCOME] == OutcomeKind.REFRESHED 
    assert result[RESULT] == []

def test_read_after_create(db_path):
    created = append_client(db_path, "FARM A", "Test User")[RESULT]
    listed = client_list(db_path)[RESULT]
    assert created in listed

#   --- append_client: success  -------------------------

def test_create_valid_client(db_path):
    result = append_client(db_path, "Farm A", modified_by="Test User")
    assert result[OUTCOME] == OutcomeKind.CREATED
    client = result[RESULT]
    assert isinstance(client["id"], int) and client["id"] > 0
    assert client["name"] == "Farm A"
    assert client["modified_by"] == "Test User"

def test_create_response_has_only_public_fields(db_path):
    client = append_client(db_path, "Farm A", "Test User")[RESULT]
    assert set(client.keys()) == {"id", "name", "modified_by"}

def test_two_distinct_clients(db_path):
    first = append_client(db_path, "Farm A", "Test User")[RESULT]
    second = append_client(db_path, "Farm B", "Test User")[RESULT]
    assert first["id"] != second["id"]
    assert committed_names(db_path) == ["Farm A", "Farm B"]

#   --- append_client: rejections   ------------------------

def test_normalized_duplicate_keep_original(db_path):
    append_client(db_path, "Farm A", "Test User")
    result = append_client(db_path, "   FARM    a", modified_by="Test User")
    assert result[OUTCOME] == OutcomeKind.DUPLICATED
    assert committed_names(db_path) == ["Farm A"]

@pytest.mark.parametrize("blank", ["", "    ", "\t\n "])
def test_whitespace_only_name_is_rejected(db_path, blank):
    result = append_client(db_path, blank)
    assert result[OUTCOME] == OutcomeKind.INVALID_NAME
    assert committed_names(db_path) == []


#   --- append_client: failures --------------------------------
@pytest.fixture 
def db_without_schema(tmp_path):
    """A valid database file with no tables, so every statement fails."""
    return str(tmp_path / "empty.db")

def test_database_error_is_unknown(db_without_schema):
    result = append_client(db_without_schema, "Farm A")
    assert result[OUTCOME] == OutcomeKind.UNKNOWN
    assert RESULT not in result

def test_busy_database(db_path, monkeypatch):
    monkeypatch.setattr("app.db.sqlite_connection.BUSY_TIMEOUT", 0.1)

    blocker = sqlite3.connect(db_path, autocommit=False)
    try:
        blocker.execute(
            "INSERT INTO clients (name, name_standardized, modified_by) VALUES (?, ?, ?)",
            ("Blocker", "blocker", "Test")
        )   # holds write block, uncommitted
        result = append_client(db_path, "FARM A")
        assert result[OUTCOME] == OutcomeKind.DATABASE_BUSY
        assert RESULT not in result 
    finally:
        blocker.rollback()
        blocker.close()

    assert committed_names(db_path) == []
        