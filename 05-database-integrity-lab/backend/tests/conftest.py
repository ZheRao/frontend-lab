import sqlite3, os
from pathlib import Path 
import pytest 

SCHEMA_SQL = (Path(__file__).resolve().parent.parent / "app" / "db" / "schema.sql").read_text()

@pytest.fixture 
def db_path(tmp_path):
    """A fresh database file with the real schema, unique to each test."""
    path = tmp_path / "test.db" # tmp_path is a built-in fixture: a new empty folder for every test, pytest cleans up afterwards
    setup = sqlite3.connect(path, autocommit=True)
    setup.executescript(SCHEMA_SQL)
    setup.close()
    return str(path)