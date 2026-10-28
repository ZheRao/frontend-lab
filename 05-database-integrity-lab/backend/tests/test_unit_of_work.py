import pytest 
from app.db.sqlite_connection import unit_of_work
from tests.helpers import insert_client, committed_names 

def test_commits_on_success(db_path):
    with unit_of_work(db_path) as conn:
        insert_client(conn, "Farm A")
    assert committed_names(db_path) == ["Farm A"]

def test_rolls_back_on_any_exception(db_path):
    with pytest.raises(ValueError):
        with unit_of_work(db_path) as conn:
            insert_client(conn, "Farm A")
            raise ValueError("oops")
    assert committed_names(db_path) == []

def test_foreign_keys_enforced(db_path):
    with unit_of_work(db_path) as conn:
        assert conn.execute("PRAGMA foreign_keys").fetchone()[0] == 1