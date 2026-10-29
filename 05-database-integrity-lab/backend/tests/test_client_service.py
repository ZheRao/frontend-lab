import sqlite3
import pytest 

from app.conventions import BackendKeys, OutcomeKind
from app.services.client_service import client_list, append_client, modify_client, remove_client
from tests.helpers import committed_names

from app.db.sqlite_connection import unit_of_work

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

def test_name_strip(db_path):
    result = append_client(db_path, "   Farm  A    ", "Test User")
    assert committed_names(db_path) == ["Farm  A"]

#   --- append_client: rejections   ------------------------

def test_normalized_duplicate_keep_original(db_path):
    append_client(db_path, "Farm A", "Test User")
    result = append_client(db_path, "   FARM    a", modified_by="Test User")
    assert result[OUTCOME] == OutcomeKind.DUPLICATED
    assert committed_names(db_path) == ["Farm A"]

@pytest.mark.parametrize("blank", ["", "    ", "\t\n "])
def test_whitespace_only_name_is_rejected_append(db_path, blank):
    result = append_client(db_path, blank)
    assert result[OUTCOME] == OutcomeKind.INVALID_NAME
    assert committed_names(db_path) == []


#   --- append_client: failures --------------------------------
@pytest.fixture 
def db_without_schema(tmp_path):
    """A valid database file with no tables, so every statement fails."""
    return str(tmp_path / "empty.db")

def test_database_error_is_unknown_append(db_without_schema):
    result = append_client(db_without_schema, "Farm A")
    assert result[OUTCOME] == OutcomeKind.UNKNOWN
    assert RESULT not in result

def test_busy_database_append(db_path, monkeypatch):
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

#   --- modify_client: success  ---------------------------------------
def test_rename_existing_client(db_path):
    result = append_client(db_path, "Farm A", "Test User 1")
    old_client = result[RESULT]
    result_update = modify_client(db_path, old_client["id"], "Farm Z", "Test User 2")
    assert result_update[OUTCOME] == OutcomeKind.UPDATED 
    client = result_update[RESULT]
    assert client["id"] == old_client["id"]
    assert client["name"] == "Farm Z"
    assert client["modified_by"] == "Test User 2"
    assert committed_names(db_path) == ["Farm Z"]

def test_rename_changes_standardized_key(db_path):
    result = append_client(db_path, "Farm A")
    client_id = result[RESULT]["id"]
    with unit_of_work(db_path) as conn:
        old_key = conn.execute("SELECT name_standardized FROM clients WHERE id = ?", (client_id,)).fetchone()[0]
    result_updated = modify_client(db_path, client_id, "Farm Z")
    with unit_of_work(db_path) as conn:
        new_key = conn.execute("SELECT name_standardized FROM clients WHERE id = ?", (client_id,)).fetchone()[0]
    assert old_key == "farm_a"
    assert new_key == "farm_z"

def test_rename_to_own_name_in_different_case(db_path):
    result = append_client(db_path, "Farm A", "Test User 1")
    result_updated = modify_client(db_path, result[RESULT]["id"], "FARM   A", "Test User 2")
    assert committed_names(db_path) == ["FARM   A"]
    assert result_updated[OUTCOME] == OutcomeKind.UPDATED 

#   --- modify_client: failures  ---------------------------------------

def test_nonexistent_id_is_not_found(db_path):
    append_client(db_path, "Farm A", "Test User")
    result = modify_client(db_path, 999, "Farm Not Exist", "Test User")
    assert result[OUTCOME] == OutcomeKind.NOT_FOUND
    assert RESULT not in result 
    assert committed_names(db_path) == ["Farm A"]

def test_rename_to_other_clients_name_is_duplicate(db_path):
    append_client(db_path, "Farm A", "Test User")
    old_result = append_client(db_path, "Farm B", "Test User")
    result = modify_client(db_path, old_result[RESULT]["id"], "FARM   A", "Test User")
    assert RESULT not in result 
    assert result[OUTCOME] == OutcomeKind.DUPLICATED
    assert committed_names(db_path) == ["Farm A", "Farm B"]

def test_busy_database_modify(db_path, monkeypatch):
    monkeypatch.setattr("app.db.sqlite_connection.BUSY_TIMEOUT", 0.1)
    old_result = append_client(db_path, "Farm A")
    blocker = sqlite3.connect(db_path, autocommit=False)
    try:
        blocker.execute("INSERT INTO clients (name, name_standardized, modified_by) VALUES (?, ?, ?)", ("test", "test", "test"))
        result = modify_client(db_path, old_result[RESULT]["id"], "test2", "test2")
        assert result[OUTCOME] == OutcomeKind.DATABASE_BUSY
        assert RESULT not in result 
    finally:
        blocker.rollback()
        blocker.close()
    assert committed_names(db_path) == ["Farm A"]

def test_database_error_is_unknown_modify(db_without_schema):
    result = modify_client(db_without_schema, 999, "Farm A")
    assert result[OUTCOME] == OutcomeKind.UNKNOWN
    assert RESULT not in result

#   --- modify_client: rejection    ----------------------------------
@pytest.mark.parametrize("blank", ["", "    ", "\t\n "])
def test_whitespace_only_name_is_rejected_modify(db_path, blank):
    old_result = append_client(db_path, "Farm A")
    result = modify_client(db_path,old_result[RESULT]["id"], blank)
    assert RESULT not in result 
    assert result[OUTCOME] == OutcomeKind.INVALID_NAME
    assert committed_names(db_path) == ["Farm A"]


#   --- delete_client: success  -----------------------------------------
def test_delete_existing_client(db_path):
    result = append_client(db_path, "Farm A")
    append_client(db_path, "Farm B")
    client = result[RESULT]
    result_delete = remove_client(db_path, client["id"])
    assert result_delete[OUTCOME] == OutcomeKind.DELETED
    deleted_client = result_delete[RESULT]
    assert deleted_client["id"] == client["id"]
    assert committed_names(db_path) == ["Farm B"]

def test_deleted_id_not_reused_and_have_increment_id(db_path):
    append_client(db_path, "Farm A")
    result = append_client(db_path, "Farm B")
    result_delete = remove_client(db_path, result[RESULT]["id"])
    result_append_after_delete = append_client(db_path, "Farm B")
    assert result_append_after_delete[RESULT]["id"] > result_delete[RESULT]["id"]
    assert committed_names(db_path) == ["Farm A", "Farm B"]

#   --- delete_client: failures -------------------------------------------
def test_delete_non_existing_client(db_path):
    append_client(db_path, "Farm A")
    result_delete = remove_client(db_path, 999)
    assert result_delete[OUTCOME] == OutcomeKind.NOT_FOUND
    assert RESULT not in result_delete
    assert committed_names(db_path) == ["Farm A"]


def test_busy_database_delete(db_path, monkeypatch):
    monkeypatch.setattr("app.db.sqlite_connection.BUSY_TIMEOUT", 0.1)
    old_result = append_client(db_path, "Farm A")
    blocker = sqlite3.connect(db_path, autocommit=False)
    try:
        blocker.execute("INSERT INTO clients (name, name_standardized, modified_by) VALUES (?, ?, ?)", ("test", "test", "test"))
        result = remove_client(db_path, old_result[RESULT]["id"])
        assert result[OUTCOME] == OutcomeKind.DATABASE_BUSY
        assert RESULT not in result 
    finally:
        blocker.rollback()
        blocker.close()
    assert committed_names(db_path) == ["Farm A"]

def test_database_error_is_unknown_delete(db_without_schema):
    result = remove_client(db_without_schema, 999)
    assert result[OUTCOME] == OutcomeKind.UNKNOWN
    assert RESULT not in result

def test_delete_referenced_client(db_path):
    result = append_client(db_path, "Farm A")
    append_client(db_path, "Farm B")
    client = result[RESULT]
    with unit_of_work(db_path) as conn:
        conn.execute(
            """
            INSERT INTO client_note (client_id, note)
            VALUES (?, ?)
            """,
            (client["id"], "test")
        )
    result_delete = remove_client(db_path, client["id"])
    assert RESULT not in result_delete
    assert result_delete[OUTCOME] == OutcomeKind.REFERENCED
    assert committed_names(db_path) == ["Farm A", "Farm B"]