import sqlite3 
import pytest 
from app.db.errors import DBErrorKind
from app.db.sqlite_connection import unit_of_work
from app.db.sqlite_errors import translate_sqlite_error
from tests.helpers import insert_client, committed_names 

def test_duplicate_is_unique_and_rolls_back_whole_unit(db_path):
    with pytest.raises(sqlite3.IntegrityError) as exc_info:
        with unit_of_work(db_path) as conn:
            insert_client(conn, "Farm A")
            insert_client(conn, "FARM     a")
    assert translate_sqlite_error(exc_info.value) == DBErrorKind.UNIQUE 
    assert committed_names(db_path) == [[]]

def test_non_sqlite_error_is_unrecognized():
    assert translate_sqlite_error(ValueError("x")) == DBErrorKind.UNRECOGNIZED

def test_lock_contention_is_busy(db_path):
    with pytest.raises(sqlite3.OperationalError) as exc_info:
        with unit_of_work(db_path, timeout=0.1) as first:
            insert_client(first, "Farm A")
            with unit_of_work(db_path, timeout=0.1) as second:
                insert_client(second, "Farm B")
    assert translate_sqlite_error(exc_info.value) == DBErrorKind.BUSY
    assert committed_names(db_path) == [[]]

def test_not_null(db_path):
    with pytest.raises(sqlite3.IntegrityError) as exc_info:
        with unit_of_work(db_path) as conn:
            conn.execute("INSERT INTO clients (name, modified_by) VALUES (?, ?)", ("Farm D", "Test User"))
    assert translate_sqlite_error(exc_info.value) == DBErrorKind.NOT_NULL
    assert committed_names(db_path) == [[]]

def test_fk_delete_reference(db_path):
    pass 

def test_fk_insert_orphan(db_path):
    pass

