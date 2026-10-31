import sqlite3, os
from pathlib import Path 
import pytest 
from fastapi.testclient import TestClient 
from main import app 

SCHEMA_SQL = (Path(__file__).resolve().parent.parent / "app" / "db" / "schema.sql").read_text()

@pytest.fixture 
def db_path(tmp_path):
    """A fresh database file with the real schema, unique to each test."""
    path = tmp_path / "test.db" # tmp_path is a built-in fixture: a new empty folder for every test, pytest cleans up afterwards
    setup = sqlite3.connect(path, autocommit=True)
    setup.executescript(SCHEMA_SQL)
    setup.close()
    return str(path)

@pytest.fixture 
def db_without_schema(tmp_path):
    """A valid database file with no tables, so every statement fails."""
    return str(tmp_path / "empty.db")


@pytest.fixture
def api(db_path, monkeypatch):
    """Routes use this test's fresh database."""
    monkeypatch.setattr("main.DB_PATH", db_path)
    return TestClient(app)

@pytest.fixture 
def api_no_raise(db_without_schema, monkeypatch):
    """Routes hit a database with no tables: unhandled errors become 500 responses."""
    monkeypatch.setattr("main.DB_PATH", db_without_schema)
    return TestClient(app, raise_server_exceptions=False)

@pytest.fixture 
def write_blocker(db_path, monkeypatch):
    """Holds the write lock for the duration of a test, with a short busy timeout."""
    monkeypatch.setattr("app.db.sqlite_connection.BUSY_TIMEOUT", 0.1)
    blocker = sqlite3.connect(db_path, autocommit=False)
    blocker.execute(
        "INSERT INTO clients (name, name_standardized, modified_by) VALUES (?, ?, ?)",
        ("Blocker", "blocker", "Test"),
    )
    yield blocker
    blocker.rollback()
    blocker.close()

@pytest.fixture 
def write_blocker2(db_path, monkeypatch):
    """Returns a function that takes the write lock when called. released after the test."""
    monkeypatch.setattr("app.db.sqlite_connection.BUSY_TIMEOUT", 0.1)
    blockers = []

    def start():
        blocker = sqlite3.connect(db_path, autocommit=False)
        blocker.execute(
            "INSERT INTO clients (name, name_standardized, modified_by) VALUES (?, ?, ?)",
            ("Blocker", "blocker", "Test")
        )
        blockers.append(blocker)

    yield start     # test receives the function, not a connection

    for blocker in blockers:        # teardown: runs after the test, pass or fail
        blocker.rollback()
        blocker.close()