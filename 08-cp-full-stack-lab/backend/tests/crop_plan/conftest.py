# tests/crop_plan/conftest.py

import sqlite3 
import pytest 

from app.crop_plan.service import create_record
from app.identity import current_user
from app.main import app

@pytest.fixture 
def client_ids(db_path):
    """insert two clients, return their ids"""
    conn = sqlite3.connect(db_path)
    try:
        id1 = conn.execute("INSERT INTO clients (name, name_standardized, modified_by) VALUES (?,?,?) RETURNING id", ("Farm A", "farm_a", "Test User")).fetchall()[0][0]
        id2 = conn.execute("INSERT INTO clients (name, name_standardized, modified_by) VALUES (?,?,?) RETURNING id", ("Farm B", "farm_b", "Test User")).fetchall()[0][0]
        conn.commit()
        return [id1, id2]
    finally:
        conn.close()

@pytest.fixture 
def make_record(client_ids, db_path):
    """factory fixture, return a function that calls use create_record with swappable arguments like crop_id=999"""

    def call_create(
        client_idx=0,
        forecast_year=2026,
        crop_id=1,
        revision_id=1,
        category_key="unit_price",
        value=100,
        memo="pytest testing",
        modified_by="Test User"
    ):
        if client_idx not in [0, 1]:
            client_idx = 0
        return (create_record(db_path,client_ids[client_idx],forecast_year,crop_id,revision_id,category_key,value,modified_by,memo))

    return call_create 
        
@pytest.fixture 
def as_user():
    app.dependency_overrides[current_user] = lambda: "Override User"
    try:
        yield "Override User"
    finally:
        app.dependency_overrides.pop(current_user, None)    # clean up